import { exec } from "child_process";
import { YouTube } from "youtube-sr";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const getFfmpegLocation = () => {
  if (process.env.FFMPEG_LOCATION) return process.env.FFMPEG_LOCATION;
  try {
    if (ffmpegPath && ffmpegPath.path && fs.existsSync(ffmpegPath.path)) {
      return path.dirname(ffmpegPath.path);
    }
  } catch {
    // ignore
  }
  return "";
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const buildDownloadFilename = (title, artist) => {
  const original = `${title} - ${artist}.mp3`;
  const asciiFallback =
    original
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u0000-\u001f\u007f"\\/:*?<>|]/g, "_")
      .replace(/[^\x20-\x7e]/g, "_")
      .trim() || "track.mp3";

  return {
    header: `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(original)}`,
  };
};

export const trackDownload = (io) => async (req, res) => {
  const { title, artist, socketId, index } = req.query;


  if (!title || !artist || !socketId || index === undefined) {
    console.error("❌ Missing parameters");
    return res.status(400).send("Missing parameters");
  }

  try {
    const searchQuery = `${title} ${artist} official audio`;
    const videos = await YouTube.search(searchQuery, {
      limit: 1,
      type: "video",
    });

    if (!videos || videos.length === 0) {
      console.error("❌ No video found");
      io.to(socketId).emit("download-error", {
        index: Number(index),
        message: "Video not found",
      });
      return res.status(404).send("Video not found");
    }

    const video = videos[0];

    const fileName = buildDownloadFilename(title, artist);
    const tempFileName = `temp-${Date.now()}-${socketId}-${index}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

    // Set response headers
    res.setHeader("Content-Disposition", fileName.header);
    res.setHeader("Content-Type", "audio/mpeg");

    // Download with yt-dlp and stream progress
    const pythonCommand =
      process.env.PYTHON_BIN ||
      (process.platform === "win32" ? "python" : "python3");
    const ffmpegLoc = getFfmpegLocation();
    const ffmpegArg = ffmpegLoc ? `--ffmpeg-location "${ffmpegLoc}"` : "";
    const downloadCommand = `"${pythonCommand}" -m yt_dlp -x --audio-format mp3 --audio-quality 0 ${ffmpegArg} --no-warnings --newline --progress -o "${tempFilePath}.%(ext)s" "${videoUrl}"`;

    const downloadProcess = exec(downloadCommand, { timeout: 120000 });

    // Track progress from yt-dlp output
    let lastProgress = 0;
    let errorOutput = "";

    downloadProcess.stdout.on("data", (data) => {
      const output = data.toString();
      const progressMatch = output.match(/(\d+\.?\d*)%/);

      if (progressMatch) {
        const percent = Math.floor(parseFloat(progressMatch[1]));
        if (percent > lastProgress) {
          lastProgress = percent;
          io.to(socketId).emit("download-progress", {
            index: Number(index),
            percent,
          });
        }
      }
    });

    downloadProcess.stderr.on("data", (data) => {
      const output = data.toString();
      errorOutput += output;

      const progressMatch = output.match(/(\d+\.?\d*)%/);

      if (progressMatch) {
        const percent = Math.floor(parseFloat(progressMatch[1]));
        if (percent > lastProgress) {
          lastProgress = percent;
          io.to(socketId).emit("download-progress", {
            index: Number(index),
            percent,
          });
        }
      }
    });

    downloadProcess.on("error", (err) => {
      console.error("❌ Download process error:", err);
      io.to(socketId).emit("download-error", {
        index: Number(index),
        message: err.message,
      });
      if (!res.headersSent) {
        res.status(500).send("Download failed");
      }

      // Cleanup
      try {
        const files = fs
          .readdirSync(tempDir)
          .filter((f) => f.startsWith(tempFileName));
        files.forEach((file) => fs.unlinkSync(path.join(tempDir, file)));
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    });

    downloadProcess.on("exit", (code) => {

      if (errorOutput) {
        console.error("❌ yt-dlp error output:", errorOutput);
      }

      if (code === 0) {
        // Find the downloaded file
        const files = fs
          .readdirSync(tempDir)
          .filter((f) => f.startsWith(tempFileName));

        if (files.length === 0) {
          console.error("❌ Downloaded file not found in temp directory");
          io.to(socketId).emit("download-error", {
            index: Number(index),
            message: "Downloaded file not found",
          });
          return res.status(500).send("File not found");
        }

        const downloadedFile = path.join(tempDir, files[0]);
        const finalPath = `${tempFilePath}.mp3`;

        // Rename to .mp3 if needed
        if (downloadedFile !== finalPath) {
          fs.renameSync(downloadedFile, finalPath);
        }
        const fileStream = fs.createReadStream(finalPath);

        fileStream.on("error", (err) => {
          console.error("❌ File stream error:", err);
          io.to(socketId).emit("download-error", {
            index: Number(index),
            message: "File stream error",
          });
        });

        fileStream.on("end", () => {
          io.to(socketId).emit("download-complete", {
            index: Number(index),
          });
          setTimeout(() => {
            try {
              if (fs.existsSync(finalPath)) {
                fs.unlinkSync(finalPath);
              }
            } catch (err) {
              console.error("Cleanup error:", err);
            }
          }, 1000);
        });

        fileStream.pipe(res);
      } else {
        console.error(`❌ Download failed with exit code: ${code}`);
        io.to(socketId).emit("download-error", {
          index: Number(index),
          message: `Download failed with code ${code}`,
        });
        if (!res.headersSent) {
          res.status(500).send("Download failed");
        }

        // Cleanup
        try {
          const files = fs
            .readdirSync(tempDir)
            .filter((f) => f.startsWith(tempFileName));
          files.forEach((file) => fs.unlinkSync(path.join(tempDir, file)));
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
    });
  } catch (err) {
    console.error("💥 Fatal error:", err);
    io.to(socketId).emit("download-error", {
      index: Number(index),
      message: err.message,
    });

    if (!res.headersSent) {
      res.status(500).send("Failed to download track");
    }
  }
};
