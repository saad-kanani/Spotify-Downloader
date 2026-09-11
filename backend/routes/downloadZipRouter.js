import express from "express";
import { downloadZip } from "../controllers/downloadZipController.js";

const router = express.Router();

export default (io) => {
  router.post("/", downloadZip(io));
  return router;
};
