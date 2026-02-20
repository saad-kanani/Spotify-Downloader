import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import playlistRoute from "./routes/playlistRoute.js";
import streamRoute from "./routes/streamRoute.js";
import downloadZipRouter from "./routes/downloadZipRouter.js";
import authRoute from "./routes/authRoute.js";

const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.VITE_FRONTEND_URL || "http://127.0.0.1:5173",
    credentials: true,
  },
});

const allowedOrigins = [
  "http://127.0.0.1:5173", // <- frontend loopback IP
  "http://127.0.0.1:5173", // same port, just in case
  "http://localhost:5173",
  process.env.VITE_FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"], // Expose Set-Cookie header
  }),
);

// These are also important
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API WORKING");
});

// ✅ Use routes
app.use("/api/playlist", playlistRoute);
app.use("/api/stream", streamRoute(io));
app.use("/api/download-zip", downloadZipRouter);
app.use("/api/auth", authRoute);

server.listen(port, () =>
  console.log("Server Started http://localhost:" + port),
);
