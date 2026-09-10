import { exec } from "child_process";
import { promisify } from "util";
import archiver from "archiver";
import { YouTube } from "youtube-sr";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const execPromise = promisify(exec);
const ffmpegLocation = path.dirname(ffmpegPath.path);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export const downloadZip = async (req, res) => {
  const { tracks } = req.body;

  if (!tracks || !tracks.length) {
    return res.status(400).json({ error: "No tracks provided" });
  }

  try {
    const archive = archiver("zip", { zlib: { level: 5 } });

    archive.on("error", (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: "Archive creation failed" });
      }
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=tracks.zip");

    archive.pipe(res);

    let successfulDownloads = 0;
    const failedDownloads = [];

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      try {
        const { name: title, artists } = track;
        const artist = Array.isArray(artists)
          ? artists.map((a) => a.name || a).join(", ")
          : "Unknown Artist";

        const searchQuery = `${title} ${artist} official audio`;
        const videos = await YouTube.search(searchQuery, {
          limit: 1,
          type: "video",
        });

        if (!videos || videos.length === 0) {
          failedDownloads.push(`${title} - No video found`);
          continue;
        }

        const video = videos[0];
        const fileName = `${title} - ${artist}.mp3`.replace(
          /[<>:"/\\|?*]/g,
          "_",
        );
        const tempFileName = `temp-${Date.now()}-${i}`;
        const tempFilePath = path.join(tempDir, tempFileName);

        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const pythonCommand = process.env.PYTHON_BIN || "python";
        const downloadCommand = `"${pythonCommand}" -m yt_dlp -x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${ffmpegLocation}" -o "${tempFilePath}.%(ext)s" "${videoUrl}"`;

        await execPromise(downloadCommand, { timeout: 60000 });

        const files = fs
          .readdirSync(tempDir)
          .filter((f) => f.startsWith(tempFileName));

        if (files.length === 0) {
          throw new Error("Downloaded file not found");
        }

        const downloadedFile = path.join(tempDir, files[0]);
        const finalPath = `${tempFilePath}.mp3`;

        if (downloadedFile !== finalPath) {
          fs.renameSync(downloadedFile, finalPath);
        }

        if (fs.existsSync(finalPath)) {
          const stats = fs.statSync(finalPath);

          if (stats.size > 1024) {
            const fileBuffer = fs.readFileSync(finalPath);
            archive.append(fileBuffer, { name: fileName });
            successfulDownloads++;
            fs.unlinkSync(finalPath);
          } else {
            throw new Error("File too small");
          }
        } else {
          throw new Error("File not found after download");
        }
      } catch (err) {
        failedDownloads.push(`${track.name} - ${err.message}`);

        const files = fs
          .readdirSync(tempDir)
          .filter((f) => f.startsWith(`temp-${Date.now()}`));
        files.forEach((file) => {
          try {
            fs.unlinkSync(path.join(tempDir, file));
          } catch (e) {}
        });
      }
    }

    if (successfulDownloads === 0) {
      return res.status(400).json({
        error: "All downloads failed",
        details: failedDownloads,
      });
    }

    archive.finalize();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to create zip file",
        details: err.message,
      });
    }
  }
};
