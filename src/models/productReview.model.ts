import mongoose, { Schema, Document } from "mongoose";

export interface IProductReview extends Document {
  user_id: mongoose.Types.ObjectId; 
  product_id: mongoose.Types.ObjectId; 
  stars: number;
  comment: string;
}

const ProductReviewSchema: Schema = new Schema<IProductReview>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
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

export default mongoose.model<IProductReview>(
  "ProductReview",
  ProductReviewSchema
);
