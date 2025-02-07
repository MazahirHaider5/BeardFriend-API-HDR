import mongoose from "mongoose";
import Stripe from "stripe";

export interface IPayment extends mongoose.Document {
    user_id: mongoose.Types.ObjectId;
    transaction_id: string;
    product_id: mongoose.Types.ObjectId[];
    price: number;
    currency: string;
    status: "pending" | "completed" | "failed" | "refund" | "disputed";
    payment_method: string;
    created_at: Date;
    //fields for Stripe webhook
    payment_intent_id?: string;
    charge_id?: string;
    receipt_url?: string;
    payment_method_details?: Stripe.PaymentMethod | null;
    error_message?: string;
    error_code?: string;
    failure_reason?: string;
}

const paymentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    transaction_id: { type: String, required: true },
    product_id: { type: [mongoose.Types.ObjectId], ref: "Product", required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    status: { 
        type: String, 
        required: true, 
        enum: ["pending", "completed", "failed", "refund", "disputed"] 
    },
    payment_method: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    // fields for Stripe webhook
    payment_intent_id: { type: String },
    charge_id: { type: String },
    receipt_url: { type: String },
    error_message: { type: String },
    failure_reason: { type: String },
    error_code: { type: String },
});

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;