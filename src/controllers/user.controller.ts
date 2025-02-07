import { Request, Response } from 'express';
import User, { IUser } from '../models/users.model';
import Product from "../models/products.model";
import Shop from "../models/barberShop.model";
import mongoose from 'mongoose';
interface IUserRequest extends Request {
  user?: IUser;
}

// Get all users (Admin only)
export const getAllUsers = async (req: IUserRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().populate('wishlist.refId', 'product_name shop_name')
      .select('-password -otp -otp_expiry')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: (error as Error).message
    });
  }
};

// Get single user (Admin or Own User)
export const getUser = async (req: IUserRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('wishlist.refId', 'product_name shop_name')
      .select('-password -otp -otp_expiry');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user is trying to access their own profile or is admin
    if (!req.user || (req.user.role !== 'admin' && req.user._id !== req.params.id)) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to access this user profile'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: (error as Error).message
    });
  }
};

// Update user (Own User or Admin)
export const updateUser = async (req: IUserRequest, res: Response): Promise<void> => {
  try {
    // Fields that cannot be updated
    const restrictedFields = ['password', 'email', 'role', 'is_verified'];
    const updates = Object.keys(req.body);

    // Check for restricted fields
    const isRestrictedUpdate = updates.some(update => restrictedFields.includes(update));
    if (isRestrictedUpdate) {
      res.status(400).json({
        success: false,
        message: 'Cannot update restricted fields'
      });
      return;
    }

    // Check if user is trying to update their own profile or is admin
    if (!req.user || (req.user.role !== 'admin' && req.user._id !== req.params.id)) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this user profile'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password -otp -otp_expiry');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: (error as Error).message
    });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: IUserRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: (error as Error).message
    });
  }
};

// Block/Unblock user (Admin only)
export const toggleUserBlock = async (req: IUserRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    user.blocked = !user.blocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.blocked ? 'blocked' : 'unblocked'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling user block status',
      error: (error as Error).message
    });
  }
};

// Wishlist request body
interface WishlistRequestBody {
  refId: string;
}

export const toggleWishlist = async (
  req: Request<{}, {}, WishlistRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { refId } = req.body;
    if (!refId || !mongoose.Types.ObjectId.isValid(refId)) {
      res.status(400).json({
        success: false,
        message: "Valid refId is required",
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.wishlist = user.wishlist || {
      products: [],
      shops: []
    };

    const objectIdRefId = new mongoose.Types.ObjectId(refId);

    const isProduct = await Product.exists({ _id: objectIdRefId });
    const isShop = await Shop.exists({ _id: objectIdRefId });

    if (!isProduct && !isShop) {
      res.status(404).json({
        success: false,
        message: "Invalid refId: neither a Product nor a Shop",
      });
      return;
    }

    if (isProduct) {
      user.wishlist.products = user.wishlist.products || [];

      const productIndex = user.wishlist.products.findIndex(
        (p) => p?.refId?.toString() === objectIdRefId.toString()
      );

      if (productIndex !== -1) {
        user.wishlist.products.splice(productIndex, 1);
      } else {
        user.wishlist.products.push({ refId: objectIdRefId });
      }
    }

    if (isShop) {
      user.wishlist.shops = user.wishlist.shops || [];

      const shopIndex = user.wishlist.shops.findIndex(
        (s) => s?.refId?.toString() === objectIdRefId.toString()
      );

      if (shopIndex !== -1) {
        user.wishlist.shops.splice(shopIndex, 1);
      } else {
        user.wishlist.shops.push({ refId: objectIdRefId });
      }
    }

    user.markModified('wishlist');

    await user.save();

    res.status(200).json({
      success: true,
      message: "Wishlist toggled successfully",
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Full Error Details:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling wishlist item",
      error: (error as Error).message,
    });
  }
};

export const getUserWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await User.findById(userId)
      .populate({
        path: 'wishlist.products.refId',
        model: 'Product',
        select: 'name price images'
      })
      .populate({
        path: 'wishlist.shops.refId',
        model: 'BarberShop',
        select: 'barbershop_name barbershop_images barbershop_address'
      });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Wishlist retrieved successfully",
      wishlist: {
        products: user.wishlist?.products || [],
        shops: user.wishlist?.shops || []
      }
    });
  } catch (error) {
    console.error("Error retrieving wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving wishlist",
      error: (error as Error).message,
    });
  }
};
