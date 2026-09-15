import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";

import playlistRoute from "./routes/playlistRoute.js";
import streamRoute from "./routes/streamRoute.js";
import downloadZipRouter from "./routes/downloadZipRouter.js";

const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);

const normalizeUrl = (url) => (url ? url.trim().replace(/\/+$/, "") : "");

const envOrigins = [
  process.env.FRONTEND_URL,
  process.env.VITE_FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((url) => url.split(","))
  .map(normalizeUrl)
  .filter(Boolean);

const allowedOrigins = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  ...envOrigins,
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = normalizeUrl(origin);
  // Automatically allow any localhost or 127.0.0.1 port (e.g. 3000, 5173, etc.)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return true;
  }
  return allowedOrigins.some((allowed) => normalizeUrl(allowed) === normalized);
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy does not allow access from this Origin"));
      }
    },
    credentials: true,
  },
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin: " +
        origin;
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ✅ Use routes
app.use("/api/playlist", playlistRoute);
app.use("/api/stream", streamRoute(io));
app.use("/api/download-zip", downloadZipRouter(io));

server.listen(port, () =>
  console.log("Server Started http://localhost:" + port),
);
