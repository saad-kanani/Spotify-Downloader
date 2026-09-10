// components/PlaylistPage.jsx
import React from "react";
import StepTracker from "../components/StepTracker";
import PlaylistCard from "../components/PlaylistCard";
import { usePlaylistContext } from "../context/PlaylistContext";
import { ImSpinner8 } from "react-icons/im";

const PlaylistPage = () => {
  const { playlists, loading } = usePlaylistContext();

  if (loading) {
    return (
      <div className="flex items-center gap-3 justify-center min-h-screen">
        <ImSpinner8 size={20} className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!playlists || playlists.length === 0) {
    return (
      <div className="text-center mt-10">
        <p>No playlists found. Please go back and try again.</p>
      </div>
    );
  }

  return (
    <div>
      <StepTracker currentStep={1} />
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-bold text-2xl">Media</h2>
      </div>
      <div className="mx-4 md:mx-0 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {playlists.map((playlist, index) => (
          <PlaylistCard key={playlist.id || index} playlist={playlist} />
        ))}
      </div>
    </div>
  );
};

export default PlaylistPage;
