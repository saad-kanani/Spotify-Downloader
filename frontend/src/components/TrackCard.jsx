import React from "react";
import { MdOutlineFileDownload } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTracks } from "../context/TracksContext";

const TrackCard = ({ track, playlistId }) => {
  const navigate = useNavigate();
  const { setTracks } = useTracks();
  const duration = `${Math.floor(track.duration_ms / 60000)}:${String(
    Math.floor((track.duration_ms % 60000) / 1000),
  ).padStart(2, "0")}`;

  const handleDownload = () => {
    setTracks([track]);
    navigate("/download", { state: { id: playlistId } });
  };

  return (
    <article className="rounded-lg bg-dark p-3 shadow-md">
      <div className="flex items-center gap-3">
        <img
          src={track.album.image}
          alt={`${track.album.name} cover`}
          className="h-16 w-16 shrink-0 rounded object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-white">{track.name}</h3>
          <p className="truncate text-sm text-gray-400">
            {track.artists.map((artist) => artist.name).join(", ")}
          </p>
          <div className="mt-1 flex gap-2 text-xs text-gray-500">
            <span className="truncate">{track.album.name}</span>
            <span aria-hidden="true">•</span>
            <span>{duration}</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleDownload}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        <span>Download</span>
        <MdOutlineFileDownload size={20} />
      </button>
    </article>
  );
};

export default TrackCard;
