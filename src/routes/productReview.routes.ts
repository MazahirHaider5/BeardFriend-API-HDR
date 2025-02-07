// routes/productReviewRoutes.ts
import express from 'express';
import { 
  createReview,
  getProductReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getProductAverageRating
} from '../controllers/productReview.controller';
import { verifyToken } from '../middleware/authenticate';

const router = express.Router();

// Create a new review (protected route)
router.post('/createProductReview', verifyToken, createReview);

// Get all reviews for a specific product
router.get('/getProduct/:productId', getProductReviews);

// Get average rating for a product
router.get('/productAvgRating/:productId', getProductAverageRating);

// Get a specific review
router.get('/getSpecificReview/:reviewId', getReviewById);

// Update a review (protected route)
router.put('/updateProductReview/:reviewId', verifyToken, updateReview);

// Delete a review (protected route)
router.delete('/deleteProductReview/:reviewId', verifyToken, deleteReview);

export default router;