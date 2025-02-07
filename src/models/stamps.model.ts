import mongoose, { Schema, Document } from "mongoose";
import { ICampaign } from "./campaigns.model";

// Stamp interface
export interface IStamp extends Document {
    user_id: mongoose.Types.ObjectId;
    barbershop_id:  mongoose.Types.ObjectId;
    stamp_name: string;
    campaign_id: mongoose.Types.ObjectId | ICampaign;
    required_stamps: number;
    stamp_expired: boolean;
    createdAt: Date;
}

const stampSchema: Schema = new Schema<IStamp>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    barbershop_id: {
        type: Schema.Types.ObjectId,
        ref: "BarberShop",
        required: true
    },
    stamp_name: {
        type: String,
        required: true
    },
    campaign_id: {
        type: Schema.Types.ObjectId,
        ref: "Campaign",
        required: true
    },
    required_stamps: {
        type: Number,
        required: true,
        default: 0
    },
    stamp_expired: {
        type: Boolean,
        default: false
    }
}, { timestamps: true});

const Stamp = mongoose.model<IStamp>("Stamp", stampSchema);
export default Stamp;
