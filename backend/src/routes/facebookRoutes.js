/**
 * Facebook Routes
 * Routes for Facebook API integration
 */

import express from "express";
import {
  getFacebookPosts,
  getPageInfo,
} from "../controllers/facebookController.js";

const router = express.Router();

// Get Facebook posts
router.get("/posts", getFacebookPosts);

// Get Facebook page info
router.get("/page", getPageInfo);

export default router;
