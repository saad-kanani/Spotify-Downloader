import express from "express";
import fetchMediaFromUrl from "../controllers/mediaController.js";

const playlistRoute = express.Router();

playlistRoute.post("/url", fetchMediaFromUrl);

export default playlistRoute;
