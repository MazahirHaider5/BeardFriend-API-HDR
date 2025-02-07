import { Request, Response } from 'express';
import ProductReview from '../models/productReview.model';
import mongoose from 'mongoose';

import { IUser } from '../models/users.model';

interface AuthRequest extends Request {
    user?: IUser  };

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { product_id, stars, comment } = req.body;
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const user_id = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(product_id)) {
            res.status(400).json({ message: 'Invalid product_id' });
            return;
        }

        const existingReview = await ProductReview.findOne({ user_id, product_id });
        if (existingReview) {
            res.status(400).json({ message: 'User has already reviewed this product' });
            return;
        }

        const review = new ProductReview({
            user_id,
            product_id,
            stars,
            comment
        });

        const savedReview = await review.save();
        res.status(201).json(savedReview);
    } catch (error) {
        res.status(500).json({ message: 'Error creating review', error });
    }
};

export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            res.status(400).json({ message: 'Invalid product ID' });
            return;
        }   

        const reviews = await ProductReview.find({ product_id: productId })
            .populate('user_id', 'name')
            .sort({ createdAt: -1 });

        res.json({Product_reviews: reviews});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error });
        return;
    }
};

export const getReviewById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ message: 'Invalid review ID' });
            return;
        }

        const review = await ProductReview.findById(reviewId)
            .populate('user_id', 'name')
            .populate('product_id', 'name');

        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }

        res.json({Product_review: review});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching review', error });
    }
};

export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reviewId } = req.params;
        const { stars, comment } = req.body;
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const user_id = req.user.id;;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ message: 'Invalid review ID' });
            return;
        }

        const review = await ProductReview.findById(reviewId);
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }

        if (review.user_id.toString() !== user_id.toString()) {
            res.status(403).json({ message: 'Not authorized to update this review' });
            return;
        }

        const updatedReview = await ProductReview.findByIdAndUpdate(
            reviewId,
            { stars, comment },
            { new: true, runValidators: true }
        );

        res.json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: 'Error updating review', error });
    }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reviewId } = req.params;
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const user_id = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ message: 'Invalid review ID' });
            return;
        }

        const review = await ProductReview.findById(reviewId);
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }

        if (review.user_id.toString() !== user_id.toString()) {
            res.status(403).json({ message: 'Not authorized to delete this review' });
            return;
        }

        await ProductReview.findByIdAndDelete(reviewId);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error });
    }
};

export const getProductAverageRating = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            res.status(400).json({ message: 'Invalid product ID' });
            return;
        }

        const result = await ProductReview.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: '$product_id',
                    averageRating: { $avg: '$stars' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const rating = result[0] || { averageRating: 0, totalReviews: 0 };
        res.json(rating);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating average rating', error });
    }
};