import { exec } from "child_process";
import { YouTube } from "youtube-sr";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const ffmpegLocation = path.dirname(ffmpegPath.path);
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

  console.log("📥 Download request:", { title, artist, socketId, index });

  if (!title || !artist || !socketId || index === undefined) {
    console.error("❌ Missing parameters");
    return res.status(400).send("Missing parameters");
  }

  try {
    console.log(`🔍 Searching for: ${title} - ${artist}`);
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
    console.log(`✅ Found video: ${video.title} (${video.id})`);

    const fileName = buildDownloadFilename(title, artist);
    const tempFileName = `temp-${Date.now()}-${socketId}-${index}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

    console.log(`⬇️ Starting download to: ${tempFilePath}`);

    // Set response headers
    res.setHeader("Content-Disposition", fileName.header);
    res.setHeader("Content-Type", "audio/mpeg");

    // Download with yt-dlp and stream progress
    const pythonCommand = process.env.PYTHON_BIN || "python";
    const downloadCommand = `"${pythonCommand}" -m yt_dlp -x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${ffmpegLocation}" --no-warnings --newline --progress -o "${tempFilePath}.%(ext)s" "${videoUrl}"`;

    console.log("🚀 Executing yt-dlp command...");
    const downloadProcess = exec(downloadCommand, { timeout: 120000 });

    // Track progress from yt-dlp output
    let lastProgress = 0;
    let errorOutput = "";

    downloadProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("📤 stdout:", output);
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
      console.log("📥 stderr:", output);
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
      console.log(`📊 Download process exited with code: ${code}`);

      if (errorOutput) {
        console.error("❌ yt-dlp error output:", errorOutput);
      }

      if (code === 0) {
        console.log("✅ Download successful, finding file...");
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

        console.log(`📁 Found file: ${files[0]}`);

        // Rename to .mp3 if needed
        if (downloadedFile !== finalPath) {
          fs.renameSync(downloadedFile, finalPath);
          console.log(`✅ Renamed to: ${finalPath}`);
        }

        // Stream file to response
        console.log("📤 Streaming file to client...");
        const fileStream = fs.createReadStream(finalPath);

        fileStream.on("error", (err) => {
          console.error("❌ File stream error:", err);
          io.to(socketId).emit("download-error", {
            index: Number(index),
            message: "File stream error",
          });
        });

        fileStream.on("end", () => {
          console.log("✅ File streaming complete");
          io.to(socketId).emit("download-complete", {
            index: Number(index),
          });

          // Clean up file after streaming
          setTimeout(() => {
            try {
              if (fs.existsSync(finalPath)) {
                fs.unlinkSync(finalPath);
                console.log("🗑️ Temp file cleaned up");
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
