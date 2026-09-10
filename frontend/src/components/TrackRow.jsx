import React from "react";
import { MdOutlineFileDownload } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTracks } from "../context/TracksContext";

const TrackRow = ({ track, playlistId, selected, onToggle }) => {
  const navigate = useNavigate();
  const { setTracks } = useTracks();

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleDownload = () => {
    setTracks([track]);
    navigate("/download", { state: { id: playlistId } });
  };

  return (
    <tr className="border-b border-darkMedium hover:bg-[#2a2a2a] transition duration-150">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(track.id)}
          aria-label={`Select ${track.name}`}
          className="h-4 w-4 accent-primary"
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap overflow-x-scroll [scrollbar-width:none] [-ms-overflow-style:none]">
        <div className="flex items-center gap-3">
          <img
            src={track.album.image}
            alt="Cover"
            className="w-12 h-12 rounded"
          />
          <div>
            <p className="text-white font-medium">{track.name}</p>
            <p className="text-sm text-gray-400">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">{track.album.name}</td>
      <td className="px-4 py-3">{formatDuration(track.duration_ms)}</td>
      <td className="px-4 py-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-primary py-2 px-4 rounded-md cursor-pointer"
        >
          <span>Download</span> <MdOutlineFileDownload size={20} />
        </button>
      </td>
    </tr>
  );
};

export default TrackRow;
