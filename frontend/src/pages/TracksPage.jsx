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

const TracksPage = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Return fallback UI if playlist isn't loaded yet
  if (!playlist) {
    return null;
  }

  const downloadZip = async () => {
    try {
      setLoading(true);

      if (!tracks || tracks.length === 0) {
        alert("No tracks selected for download");
        return;
      }

      console.log("Sending tracks to download:", tracks);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/download-zip`,
        { tracks },
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
      setLoading(false);
    }
  };

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
                <th className="px-4 py-3 font-medium">#</th>
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
                    index={index}
                    track={track}
                    playlistId={id}
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
              />
            ))
          ) : (
            <p className="py-4 text-center text-gray-500">
              No matching tracks found.
            </p>
          )}
        </div>

        {/* Download All Button */}
        <div className="flex justify-center">
          <button
            onClick={downloadZip}
            disabled={loading}
            className="flex items-center gap-2 bg-primary py-2 px-4 rounded-full cursor-pointer"
          >
            {loading ? (
              <ImSpinner8 className="animate-spin" />
            ) : (
              <MdOutlineFileDownload size={20} />
            )}
            <span>
              {loading
                ? "Downloading..."
                : tracks.length === 1
                  ? "Download Track"
                  : "Download All Tracks"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TracksPage;
