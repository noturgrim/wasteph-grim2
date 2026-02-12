import express from "express";
import { getFiles, getFileDownloadUrl } from "../controllers/fileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getFiles);
router.get("/:id/download", getFileDownloadUrl);

export default router;
