import { fetchMedia } from "../services/spotapiService.js";

const spotifyUrlPattern = /(?:spotify:(track|album|playlist):|(track|album|playlist)\/)([a-zA-Z0-9]+)/i;

const fetchMediaFromUrl = async (req, res) => {
  const input = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  const match = input.match(spotifyUrlPattern);
  const mediaType = match?.[1] || match?.[2];
  const mediaId = match?.[3];

  if (!mediaType || !mediaId) {
    return res.status(400).json({
      error: "Enter a valid Spotify track, album, or playlist URL.",
    });
  }

  try {
    const media = await fetchMedia(mediaType.toLowerCase(), mediaId);
    return res.json([media]);
  } catch (error) {
    console.error("SpotAPI media fetch error:", error.message);
    return res.status(502).json({ error: "Failed to fetch Spotify media." });
  }
};

export default fetchMediaFromUrl;