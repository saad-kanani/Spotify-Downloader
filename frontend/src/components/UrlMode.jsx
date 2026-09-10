import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiDownload, FiDisc, FiList, FiLoader, FiMusic } from "react-icons/fi";
import { useState } from "react";
import { toast } from "sonner";
import { usePlaylistContext } from "../context/PlaylistContext";

const mediaTabs = [
  { value: "track", label: "Track", icon: FiMusic },
  { value: "album", label: "Album", icon: FiDisc },
  { value: "playlist", label: "Playlist", icon: FiList },
];

const UrlMode = () => {
  const [url, setUrl] = useState("");
  const [mediaType, setMediaType] = useState("track");
  const [loading, setLoading] = useState(false);
  const { setUrlPlaylists } = usePlaylistContext();
  const navigate = useNavigate();

  const handleFetchMedia = async () => {
    const mediaPattern = new RegExp(
      `(?:${mediaType})\\/([a-zA-Z0-9]+)|spotify:${mediaType}:([a-zA-Z0-9]+)`,
      "i",
    );

    if (!mediaPattern.test(url)) {
      toast.error(
        `Invalid Spotify ${mediaType} URL. Please check the URL and try again.`,
        {
          classNames: { icon: "!text-red-500" },
        },
      );
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/playlist/url`,
        { url },
      );

      setUrlPlaylists(res.data);
      navigate("/tracks", { state: { id: res.data[0]?.id } });
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to fetch Spotify media.",
        {
          classNames: { icon: "!text-red-500" },
        },
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col max-w-4xl gap-6">
      <div
        className="flex justify-center  gap-4"
        role="tablist"
        aria-label="Spotify media type"
      >
        <div className="flex w-full rounded-lg bg-dark p-1">
          {mediaTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={mediaType === tab.value}
              onClick={() => setMediaType(tab.value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mediaType === tab.value
                  ? "bg-primary text-white"
                  : "text-grayMuted hover:text-white"
              }`}
            >
              <tab.icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center">
        Paste a Spotify {mediaType} URL
      </h2>
      <p className="text-center text-sm text-grayMuted">
        Fetch public Spotify media and download tracks as MP3 files
      </p>
      <div className="flex justify-center sm:flex-row sm:gap-0 gap-3.5 flex-col">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-darkMedium border border-darkLight text-white text-md rounded sm:rounded-e-none sm:rounded-s   focus:ring-primary focus:border-primary block w-full p-2.5"
          placeholder={`https://open.spotify.com/${mediaType}/...`}
          required
        />
        <button
          onClick={handleFetchMedia}
          disabled={loading || !url}
          className="flex items-center justify-center gap-1.5 bg-primary text-white px-4 py-2 rounded sm:rounded-s-none sm:rounded-e cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? "Fetching..." : "Download"}</span>
          {loading ? <FiLoader className="animate-spin" /> : <FiDownload />}
        </button>
      </div>
    </div>
  );
};

export default UrlMode;
