import mongoose, { Schema, Document } from "mongoose";

export interface IShopReview extends Document {
  user_id: mongoose.Types.ObjectId; // Reference to User table
  barber_shop_id: mongoose.Types.ObjectId; // Reference to BarberShop table
  stars: number;
  comment: string;
}

const ShopReviewSchema: Schema = new Schema<IShopReview>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    barber_shop_id: {
      type: Schema.Types.ObjectId,
      ref: "BarberShop",
      required: true
    },
    stars: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    comment: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IShopReview>("ShopReview", ShopReviewSchema);
