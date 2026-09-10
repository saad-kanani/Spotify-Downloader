import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StepTracker from "../components/StepTracker";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlaylistContext } from "../context/PlaylistContext";
import { IoSearch } from "react-icons/io5";
import TrackRow from "../components/TrackRow";
import TrackCard from "../components/TrackCard";
import { MdOutlineFileDownload } from "react-icons/md";
import { ImSpinner8 } from "react-icons/im";
import { io } from "socket.io-client";
import { toast } from "sonner";

const MAX_DOWNLOAD_TRACKS = 6;

const zipSocket = io(
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000",
  { transports: ["websocket"], withCredentials: true },
);

const TracksPage = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [zipProgress, setZipProgress] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const id = location.state?.id;
  const { playlists } = usePlaylistContext();

  const playlist = playlists.find((pl) => pl.id === id);
  const tracks = playlist?.tracks || [];
  const mediaLabel = playlist?.type || "playlist";

  const filteredTracks = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (keyword === "") return tracks;
    return tracks.filter((track) =>
      `${track.name} ${track.artists.map((a) => a.name).join(" ")} ${
        track.album.name
      }`
        .toLowerCase()
        .includes(keyword),
    );
  }, [tracks, searchKeyword]);

  useEffect(() => {
    if (!playlists.length || !id || !playlist) {
      navigate("/");
    }
  }, [playlists, id, playlist, navigate]);

  useEffect(() => {
    setSelectedTrackIds([]);
  }, [id]);

  // Return fallback UI if playlist isn't loaded yet
  if (!playlist) {
    return null;
  }

  const downloadZip = async () => {
    const selectedTracks = tracks.filter((track) =>
      selectedTrackIds.includes(track.id),
    );

    if (selectedTracks.length === 0) {
      alert("No tracks selected for download");
      return;
    }

    let progressTimer;
    let downloadSucceeded = false;

    try {
      setLoading(true);
      if (!zipSocket.connected) zipSocket.connect();
      const socketId = zipSocket.id || null;
      setZipProgress({
        completed: 0,
        total: selectedTracks.length,
        percent: 2,
        startedAt: Date.now(),
        status: "downloading",
        track: selectedTracks[0]?.name,
      });

      progressTimer = setInterval(() => {
        setZipProgress((current) => {
          if (!current || current.percent >= 92) return current;

          const percent = Math.min(
            92,
            current.percent + 92 / (selectedTracks.length * 15),
          );
          const currentIndex = Math.min(
            selectedTracks.length - 1,
            Math.floor((percent / 100) * selectedTracks.length),
          );
          const completed =
            selectedTracks.length === 1
              ? 0
              : Math.min(
                  selectedTracks.length - 1,
                  Math.max(
                    current.completed,
                    1,
                    Math.floor((percent / 92) * selectedTracks.length),
                  ),
                );

          return {
            ...current,
            percent,
            completed,
            track: selectedTracks[currentIndex]?.name,
          };
        });
      }, 1000);

      console.log("Sending tracks to download:", selectedTracks);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/download-zip`,
        { tracks: selectedTracks, socketId },
        {
          responseType: "blob",
          timeout: 300000, // 5 minutes
        },
      );

      // Check if response is JSON error instead of blob
      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const errorText = await new Response(response.data).text();
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || "Download failed");
      }

      const blob = new Blob([response.data], { type: "application/zip" });

      if (blob.size === 0) {
        throw new Error("Received empty file");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tracks.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      downloadSucceeded = true;

      console.log("Download completed successfully");
    } catch (error) {
      console.error("ZIP download failed:", error);

      // Handle blob error responses
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await new Response(error.response.data).text();
          const errorData = JSON.parse(errorText);
          alert(
            `Download failed: ${errorData.error}\n\nDetails: ${
              errorData.details?.join("\n") || "Unknown error"
            }`,
          );
        } catch {
          alert("Download failed: Server error");
        }
      } else if (error.response?.status === 400) {
        alert(
          "Download failed: Could not find or download the requested tracks. Please try different songs.",
        );
      } else {
        alert(`Download failed: ${error.message}`);
      }
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
      setZipProgress((current) =>
        current
          ? {
              ...current,
              completed: downloadSucceeded ? current.total : current.completed,
              percent: downloadSucceeded ? 100 : current.percent,
              status: downloadSucceeded ? "completed" : "failed",
            }
          : current,
      );
      setTimeout(() => setZipProgress(null), 1500);
    }
  };

  useEffect(() => {
    const handleZipProgress = ({ completed, total, status, track }) => {
      setZipProgress((current) =>
        current
          ? {
              ...current,
              completed,
              total,
              percent: Math.max(current.percent, (completed / total) * 100),
              status,
              track,
            }
          : current,
      );
    };

    zipSocket.on("zip-progress", handleZipProgress);
    return () => zipSocket.off("zip-progress", handleZipProgress);
  }, []);

  const toggleTrack = (trackId) => {
    setSelectedTrackIds((currentIds) => {
      if (currentIds.includes(trackId)) {
        return currentIds.filter((idValue) => idValue !== trackId);
      }

      if (currentIds.length >= MAX_DOWNLOAD_TRACKS) {
        toast.error(
          `You can download up to ${MAX_DOWNLOAD_TRACKS} tracks at a time.`,
        );
        return currentIds;
      }

      return [...currentIds, trackId];
    });
  };

  const allFilteredSelected =
    filteredTracks.length > 0 &&
    filteredTracks.every((track) => selectedTrackIds.includes(track.id));

  const toggleAllFiltered = () => {
    const filteredIds = filteredTracks.map((track) => track.id);
    setSelectedTrackIds((currentIds) => {
      if (allFilteredSelected) {
        return currentIds.filter((trackId) => !filteredIds.includes(trackId));
      }

      const availableSlots = MAX_DOWNLOAD_TRACKS - currentIds.length;
      const idsToAdd = filteredIds
        .filter((trackId) => !currentIds.includes(trackId))
        .slice(0, availableSlots);

      if (idsToAdd.length < filteredIds.length) {
        toast.error(
          `You can download up to ${MAX_DOWNLOAD_TRACKS} tracks at a time.`,
        );
      }

      return [...new Set([...currentIds, ...idsToAdd])];
    });
  };

  const selectedCount = selectedTrackIds.length;
  const progressPercent = zipProgress ? Math.round(zipProgress.percent) : 0;
  const elapsedSeconds = zipProgress
    ? Math.max(1, (Date.now() - zipProgress.startedAt) / 1000)
    : 0;
  const remainingSeconds =
    zipProgress && zipProgress.completed > 0
      ? Math.ceil(
          (elapsedSeconds / zipProgress.completed) *
            (zipProgress.total - zipProgress.completed),
        )
      : null;

  const formatRemaining = (seconds) => {
    if (seconds === null) return "Calculating time...";
    if (seconds < 60) return `About ${seconds}s remaining`;
    return `About ${Math.ceil(seconds / 60)} min remaining`;
  };

  const downloadAllButton = (
    <button
      onClick={downloadZip}
      disabled={loading || selectedCount === 0}
      className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <ImSpinner8 className="animate-spin" />
      ) : (
        <MdOutlineFileDownload size={20} />
      )}
      <span>
        {loading
          ? "Downloading..."
          : selectedCount === tracks.length &&
              tracks.length <= MAX_DOWNLOAD_TRACKS
            ? "Download All Tracks"
            : `Download ${selectedCount} Track${selectedCount === 1 ? "" : "s"}`}
      </span>
    </button>
  );

  return (
    <div>
      <StepTracker currentStep={2} />
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-400 capitalize">{mediaLabel}</p>
            <h2 className="font-bold text-2xl">{playlist.name}</h2>
          </div>
          <p className="text-gray-400 text-sm">
            {tracks.length > 1
              ? `${tracks.length} Tracks`
              : `${tracks.length} Track`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg bg-dark p-3">
          <p className="text-sm text-gray-400">
            {selectedCount} of {tracks.length} selected (max{" "}
            {MAX_DOWNLOAD_TRACKS})
          </p>
          {downloadAllButton}
        </div>

        {zipProgress && (
          <div className="rounded-lg bg-dark p-4" aria-live="polite">
            <div className="mb-2 flex justify-between text-sm">
              <span>
                {zipProgress.status === "completed"
                  ? "ZIP ready"
                  : zipProgress.status === "failed"
                    ? "Download failed"
                    : "Downloading your tracks..."}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-darkLight">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-grayMuted">
              <span>
                {zipProgress.completed} of {zipProgress.total} tracks processed
              </span>
              <span>{formatRemaining(remainingSeconds)}</span>
            </div>
            {zipProgress.track && (
              <p className="mt-2 truncate text-xs text-grayMuted">
                {zipProgress.status === "completed"
                  ? `Downloaded: ${zipProgress.track}`
                  : zipProgress.status === "failed"
                    ? `Stopped at: ${zipProgress.track}`
                    : `Downloading: ${zipProgress.track}`}
              </p>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            type="text"
            placeholder="Search Tracks..."
            className="bg-dark text-white text-md rounded-md outline-none focus:outline-none focus:ring-0 focus:border-transparent block w-full p-2.5 pl-10"
          />
          <IoSearch
            size={20}
            className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400"
          />
        </div>

        {/* Desktop track table */}
        <div className="hidden overflow-x-auto rounded-md shadow md:block">
          <table className="table-auto bg-dark min-w-full text-sm text-left text-gray-300">
            <thead className="text-gray-400 uppercase text-xs rounded border-b border-darkLight">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                    aria-label="Select all visible tracks"
                    className="h-4 w-4 accent-primary"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Album</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.length > 0 ? (
                filteredTracks.map((track, index) => (
                  <TrackRow
                    key={track.id || index}
                    track={track}
                    playlistId={id}
                    selected={selectedTrackIds.includes(track.id)}
                    onToggle={toggleTrack}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No matching tracks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile track cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track, index) => (
              <TrackCard
                key={track.id || index}
                track={track}
                playlistId={id}
                selected={selectedTrackIds.includes(track.id)}
                onToggle={toggleTrack}
              />
            ))
          ) : (
            <p className="py-4 text-center text-gray-500">
              No matching tracks found.
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {downloadAllButton}
        </div>
      </div>
    </div>
  );
};

export default TracksPage;
