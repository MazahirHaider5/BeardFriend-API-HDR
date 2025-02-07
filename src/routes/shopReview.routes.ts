import express from "express";
import {
  createReview,
  getShopReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getShopAverageRating
} from "../controllers/shopReview.controller";
import { verifyToken } from "../middleware/authenticate";

const router = express.Router();

router.post("/createShopReview", verifyToken, createReview);

router.get("/getShopReviews/:shopId", getShopReviews);

router.get("/getAverageRating/:shopId", getShopAverageRating);

router.get("/getSpecificReview/:reviewId", getReviewById);

router.put("/UpdateShopReview/:reviewId", verifyToken, updateReview);

router.delete("/DeleteShopReview", verifyToken, deleteReview);

export default router;
