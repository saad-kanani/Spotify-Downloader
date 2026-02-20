import axios from "axios";
import crypto from "crypto";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-top-read",
  // add more scopes as needed
].join(" ");

const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString("hex").slice(0, length);
};

var stateKey = "spotify_auth_state";

export const loginWithSpotify = (req, res) => {
  try {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(
      SCOPES,
    )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;

    console.log("Redirecting to Spotify...");

    return res.redirect(authURL); // 👈 IMPORTANT
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Login failed");
  }
};

// In your exchangeSpotifyCode function - add logging
export const exchangeSpotifyCode = async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  console.log("🔐 Exchange Spotify Code - Cookies received:", req.cookies);
  console.log("🔐 State validation:", { state, storedState });

  if (state === null || state !== storedState) {
    console.log("❌ State mismatch");
    return res.redirect(`${FRONTEND_URL}?error=state_mismatch`);
  }

  if (!code) return res.status(400).send("Missing code");

  try {
    res.clearCookie(stateKey);

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);

    const authToken = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64",
    );

    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      params,
      {
        headers: {
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { access_token, refresh_token } = tokenRes.data;

    console.log("✅ Tokens received, setting cookies...");

    res.cookie("spotify_access_token", access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 3600000,
    });

    // Refresh token
    res.cookie("spotify_refresh_token", refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 3600000,
    });

    console.log(
      "✅ Cookies set with domain:",
      process.env.NODE_ENV === "production" ? "yourdomain.com" : "localhost",
    );
    res.redirect(FRONTEND_URL + "/callback");
  } catch (err) {
    console.error(
      "❌ Token exchange error:",
      err.response?.data || err.message,
    );
    res.clearCookie(stateKey);
    return res.redirect(`${FRONTEND_URL}?error=authentication_failed`);
  }
};

export const getAuthStatus = async (req, res) => {
  try {
    console.log("🔐 Auth Status Check - All cookies:", req.cookies);
    console.log("🔐 Auth Status Check - Headers:", req.headers);

    // Get access token from HTTP-only cookie
    const access_token = req.cookies.spotify_access_token;

    if (!access_token) {
      console.log("❌ No access token found in cookies");
      console.log("❌ Available cookies:", Object.keys(req.cookies));
      return res.json({
        isAuthenticated: false,
        message: "No access token found",
        availableCookies: Object.keys(req.cookies),
      });
    }

    console.log("✅ Access token found, verifying with Spotify...");

    // Verify token is still valid
    const userResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    console.log("✅ Token is valid, user:", userResponse.data.id);

    res.json({
      isAuthenticated: true,
      user: {
        id: userResponse.data.id,
        display_name: userResponse.data.display_name,
        email: userResponse.data.email,
        country: userResponse.data.country,
        product: userResponse.data.product,
        image: userResponse.data.images?.[0]?.url || null,
      },
    });
  } catch (error) {
    console.error(
      "❌ Auth status check error:",
      error.response?.data || error.message,
    );

    // Token is invalid/expired - clear cookies
    res.clearCookie("spotify_access_token");
    res.clearCookie("spotify_refresh_token");

    res.json({
      isAuthenticated: false,
      message: "Token invalid or expired",
      error: error.response?.data || error.message,
    });
  }
};

export const logout = (req, res) => {
  try {
    // Clear the HTTP-only cookies
    res.clearCookie("spotify_access_token");
    res.clearCookie("spotify_refresh_token");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
