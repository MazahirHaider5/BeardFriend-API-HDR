import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  product_name: string;
  product_description: string;
  product_price: number;
  product_instock: boolean;
  product_sold: number;
  total_products: number;
  product_photos: string[];
  product_discount: number; 
}

const ProductSchema: Schema = new Schema<IProduct>(
  {
    product_name: {
      type: String,
      required: true
    },
    product_description: {
      type: String,
      required: true
    },
    product_price: {
      type: Number,
      required: true
    },
    product_instock: {
      type: Boolean,
      required: true,
      default: true
    },
    product_sold: {
      type: Number,
      required: true,
      default: 0
    },
    total_products: {
      type: Number,
      required: true
    },
    product_photos: {
      type: [String],
      required: true
    },
    product_discount: {
      type: Number,
      required: false,
      default: 0,
      min: 0, // ensures that percentage will not be negative
      max: 100 // ensures that percentage will not exceed 100
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IProduct>("Product", ProductSchema);
