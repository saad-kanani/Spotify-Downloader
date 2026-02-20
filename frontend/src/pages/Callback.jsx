// components/Callback.jsx
import { useEffect, useRef } from "react";
import { usePlaylistContext } from "../context/PlaylistContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ImSpinner8 } from "react-icons/im";
import axios from "axios";

const Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setLoginData } = usePlaylistContext();
  const hasExecuted = useRef(false); // Add this ref

  useEffect(() => {
    // Prevent multiple executions
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const initializeApp = async () => {
      try {
        // Check if there's an error from Spotify
        const error = searchParams.get("error");
        if (error) {
          throw new Error(`Spotify authentication failed: ${error}`);
        }

        console.log("🔄 Starting authentication process...");

        // Wait a bit longer for cookies to be set
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // First, check if we're actually authenticated
        console.log("🔐 Checking authentication status...");
        const authStatusResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/status`,
          { withCredentials: true },
        );

        console.log("🔐 Auth status response:", authStatusResponse.data);

        if (!authStatusResponse.data.isAuthenticated) {
          // Provide more detailed error message
          const errorMsg =
            authStatusResponse.data.message || "Authentication failed";
          const availableCookies =
            authStatusResponse.data.availableCookies || [];

          console.error("❌ Authentication failed:", {
            message: errorMsg,
            availableCookies: availableCookies,
          });

          throw new Error(
            `Authentication failed: ${errorMsg}. Available cookies: ${availableCookies.join(", ")}`,
          );
        }

        console.log("✅ Authenticated, fetching playlists...");

        // Now fetch user data and playlists
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/playlist/user`,
          { withCredentials: true },
        );

        console.log("✅ Playlists fetched successfully");

        // Set login data in context
        setLoginData(response.data.user, response.data.playlists);

        toast.success(`Welcome, ${response.data.user.display_name}!`);
        navigate("/playlist");
      } catch (error) {
        console.error("❌ Initialization error:", error);

        let errorMessage = "Authentication failed";

        if (error.message.includes("cookies")) {
          errorMessage =
            "Browser cookie issue detected. Please check your browser settings or try a different browser.";
        } else if (error.response?.status === 401) {
          errorMessage =
            "Session expired or invalid. Please try logging in again.";
        } else if (error.message.includes("Spotify")) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        navigate("/");
      }
    };

    initializeApp();

    // Empty dependency array since we're using ref to control execution
  }, []); // Remove all dependencies

  return (
    <div className="flex items-center gap-3 justify-center min-h-screen">
      <ImSpinner8 size={20} className="animate-spin" />
      <span className="text-2xl text-center">Completing authentication...</span>
    </div>
  );
};

export default Callback;
