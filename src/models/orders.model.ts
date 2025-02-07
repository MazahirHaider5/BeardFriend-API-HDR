import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  product_id: mongoose.Types.ObjectId; // Reference to Product table
  order_date: Date;
  order_items: { product: mongoose.Types.ObjectId; quantity: number }[]; // Array of products with quantities
  order_price: number[]; // Prices for multiple order items
  order_status: "pending" | "in process" | "delivered" | "cancelled";
  order_payment_status: boolean;
  user_id: mongoose.Types.ObjectId; // Reference to User table
  stripe_customer_id?: mongoose.Types.ObjectId; // Reference to User table's stripe_customer_id
  paypal_customer_id?: mongoose.Types.ObjectId; // Reference to User table's paypal_customer_id
}

const OrderSchema: Schema = new Schema<IOrder>(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    order_date: {
      type: Date,
      default: Date.now
    },
    order_items: [
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
          min: 1 // ensures that quantity is at least 1
        }
      }
    ],
    order_price: [
      {
        type: Number,
        required: true,
        min: 0 // ensures that prices are non-negative
      }
    ],
    order_status: {
      type: String,
      enum: ["pending", "in process", "delivered", "cancelled"],
      default: "pending"
    },
    order_payment_status: {
      type: Boolean,
      required: true,
      default: false
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    stripe_customer_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: false
    },
    paypal_customer_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
