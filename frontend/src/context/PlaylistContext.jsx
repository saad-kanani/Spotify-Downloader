// context/PlaylistContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // 'login' or 'url'

  // Check authentication status on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        axios.defaults.withCredentials = true;

        // Check if we're authenticated with Spotify
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/status`,
          {
            withCredentials: true,
          },
        );

        if (response.data.isAuthenticated) {
          setUser(response.data.user);
          setMode("login");
          await fetchPlaylists();
        } else {
          setMode("url");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setMode("url");
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/playlist/user`,
      );
      setPlaylists(response.data.playlists || []);
      setMode("login");
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
      setPlaylists([]);
    }
  };

  // For URL mode - just set the playlists directly
  const setUrlPlaylists = (urlPlaylists) => {
    setPlaylists(urlPlaylists);
    setMode("url");
    setUser(null); // Clear user data in URL mode
  };

  // For login mode - set user and optionally playlists
  const setLoginData = (userData, userPlaylists = []) => {
    setUser(userData);
    setPlaylists(userPlaylists);
    setMode("login");
  };

  const logout = async () => {
    if (mode === "login") {
      try {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
          {},
          {
            withCredentials: true,
          },
        );
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    // Clear all state
    setUser(null);
    setPlaylists([]);
    setMode(null);
  };

  const value = {
    user,
    playlists,
    mode,
    loading,
    // Actions
    setUrlPlaylists,
    setLoginData,
    fetchPlaylists,
    logout,
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
