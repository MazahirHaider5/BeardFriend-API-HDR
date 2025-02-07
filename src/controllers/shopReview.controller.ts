import { Request, Response } from "express";
import ShopReview from "../models/shopReview.model";
import BarberShop from "../models/barberShop.model";
import mongoose from "mongoose";
import { IUser } from "../models/users.model";

interface AuthRequest extends Request {
  user?: IUser;
}

// Create a new review
export const createReview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { barber_shop_id, stars, comment } = req.body;

    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    const user_id = req.user.id;

    // Validate barber_shop_id
    if (!mongoose.Types.ObjectId.isValid(barber_shop_id)) {
      res.status(400).json({ message: "Invalid barber_shop_id" });
      return;
    }

    // Validate stars rating
    if (stars < 1 || stars > 5) {
      res.status(400).json({ message: "Stars rating must be between 1 and 5" });
      return;
    }

    // Check if barber shop exists
    const barberShop = await BarberShop.findById(barber_shop_id)
      .session(session)
      .lean();
    if (!barberShop) {
      res.status(404).json({ message: "Barber shop does not exist" });
      return;
    }

    // Check if user has already reviewed the shop
    const existingReview = await ShopReview.findOne({
      user_id,
      barber_shop_id,
    })
      .session(session)
      .lean();

    if (existingReview) {
      res
        .status(400)
        .json({ message: "User has already reviewed this barber shop" });
      return;
    }

    // Create a new review
    const review = new ShopReview({
      user_id,
      barber_shop_id,
      stars,
      comment,
    });

    const savedReview = await review.save({ session });

    barberShop.reviews.push(savedReview.id);
    await BarberShop.findByIdAndUpdate(
      barber_shop_id,
      { $push: { reviews: savedReview._id } },
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: savedReview,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: "Error creating review",
      error: Error
    });
    return;
  }
};

// Get all reviews for a specific shop
export const getShopReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      res.status(400).json({ message: "Invalid shop ID" });
      return;
    }

    const reviews = await ShopReview.find({ barber_shop_id: shopId })
      .populate("user_id", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews", error });
    return;
  }
};

// Get a specific review by ID
export const getReviewById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: "Invalid review ID" });
      return;
    }

    const review = await ShopReview.findById(reviewId)
      .populate("user_id", "name")
      .populate("barber_shop_id", "name");

    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Error fetching review", error });
    return;
  }
};

// Update a review
export const updateReview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { stars, comment } = req.body;
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    const user_id = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: "Invalid review ID" });
      return;
    }

    // Find the review first to check ownership
    const review = await ShopReview.findById(reviewId);
    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    // Verify review ownership
    if (review.user_id.toString() !== user_id.toString()) {
      res.status(403).json({ message: "Not authorized to update this review" });
      return;
    }

    const updatedReview = await ShopReview.findByIdAndUpdate(
      reviewId,
      { stars, comment },
      { new: true, runValidators: true }
    );

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: "Error updating review", error });
  }
};

// Delete a review
export const deleteReview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId, barber_shop_id } = req.body;
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    if (!reviewId || !barber_shop_id) {
      res.status(401).json({ message: "all fields required" });
      return;
    }
    const user_id = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: "Invalid review ID" });
      return;
    }
    const barberShop = await BarberShop.findById(barber_shop_id);
    if (!barberShop) {
      res.status(404).json({ message: "barberShop not found" });
      return;
    }
    // Find the review first to check ownership
    const review = await ShopReview.findById(reviewId);
    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    // Verify review ownership
    if (review.user_id.toString() !== user_id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this review" });
      return;
    }
    await BarberShop.findByIdAndUpdate(
      { _id: barber_shop_id },
      {
        $pull: { reviews: reviewId }
      }
    );
    await ShopReview.findByIdAndDelete(reviewId);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error });
  }
};

// Get average rating for a shop
export const getShopAverageRating = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      res.status(400).json({ message: "Invalid shop ID" });
      return;
    }

    const result = await ShopReview.aggregate([
      { $match: { barber_shop_id: new mongoose.Types.ObjectId(shopId) } },
      {
        $group: {
          _id: "$barber_shop_id",
          averageRating: { $avg: "$stars" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const rating = result[0] || { averageRating: 0, totalReviews: 0 };
    res.json(rating);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error calculating average rating", error });
    return;
  }
};
