// context/PlaylistContext.jsx
import React, { createContext, useState, useContext } from "react";

const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading] = useState(false);

  // For URL mode - just set the playlists directly
  const setUrlPlaylists = (urlPlaylists) => {
    setPlaylists(urlPlaylists);
  };

  const value = {
    playlists,
    loading,
    setUrlPlaylists,
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylistContext = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error(
      "usePlaylistContext must be used within a PlaylistProvider",
    );
  }
  return context;
};
