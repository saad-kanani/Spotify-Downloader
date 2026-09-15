import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DownloadCard from "../components/DownloadCard";
import StepTracker from "../components/StepTracker";
import { useTracks } from "../context/TracksContext";
import { toast } from "sonner";

const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4000", {
  transports: ["websocket"],
  withCredentials: true,
});

const DownloadPage = () => {
  const { tracks } = useTracks();

  const navigate = useNavigate();
  const location = useLocation();

  const id = location.state?.id;

  const [progress, setProgress] = useState([]);
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    if (!tracks.length) {
      navigate("/");
      return;
    }

    setProgress(tracks.map(() => 0));
    setCompleted(tracks.map(() => false));

    const handleDownloadProgress = ({ index, percent }) => {
      setProgress((prev) => prev.map((p, i) => (i === index ? percent : p)));
    };

    const handleDownloadComplete = ({ index }) => {
      setCompleted((prev) => prev.map((c, i) => (i === index ? true : c)));
    };

    const handleDownloadError = ({ index, message }) => {
      console.error(`Track ${index} Error: ${message}`);
      toast.error(`Track ${index} Error: ${message}`);
      navigate("/tracks", { state: { id } });
    };

    socket.on("download-progress", handleDownloadProgress);
    socket.on("download-complete", handleDownloadComplete);
    socket.on("download-error", handleDownloadError);

    const startDownloads = () => {
      const socketId = socket.id;
      if (!socketId) return;

      tracks.forEach((track, index) => {
        const { name, artists } = track;
        const url = new URL(
          `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/stream`,
        );
        url.searchParams.append("title", name);
        url.searchParams.append(
          "artist",
          artists.map((artist) => artist.name).join(", "),
        );
        url.searchParams.append("socketId", socketId);
        url.searchParams.append("index", index);

        const anchor = document.createElement("a");
        anchor.href = url.toString();
        anchor.setAttribute("download", "");
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      });
    };

    if (socket.connected) {
      startDownloads();
    } else {
      socket.once("connect", startDownloads);
      socket.connect();
    }

    return () => {
      socket.off("connect", startDownloads);
      socket.off("download-progress", handleDownloadProgress);
      socket.off("download-complete", handleDownloadComplete);
      socket.off("download-error", handleDownloadError);
    };
  }, [tracks, navigate, id]);

  useEffect(() => {
    if (completed.length > 0 && completed.every(Boolean)) {
      navigate("/tracks", { state: { id } });
    }
  }, [completed, id, navigate]);

  if (!tracks.length) return null;

  return (
    <div>
      <StepTracker currentStep={3} />
      <div className="flex flex-col gap-4 lg:mx-50">
        <h2 className="font-bold text-2xl">Downloading Tracks</h2>
        {tracks.map((track, index) => (
          <DownloadCard
            key={index}
            track={track}
            percent={progress[index]}
            completed={completed[index]}
          />
        ))}
      </div>
    </div>
  );
};

export default DownloadPage;
