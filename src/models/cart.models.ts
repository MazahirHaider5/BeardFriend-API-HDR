import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  cart_product_ids: { product_id: mongoose.Types.ObjectId; quantity: number }[]; // Array of products with quantities
  total_cart_items: number;
  total_price: number;
  shipping_charges: number;
  subtotal: number;
}

const CartSchema: Schema = new Schema<ICart>(
  {
    cart_product_ids: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1
        }
      }
    ],
    total_cart_items: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    total_price: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    shipping_charges: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ICart>("Cart", CartSchema);
