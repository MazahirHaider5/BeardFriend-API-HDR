import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  campaign_name: string;
  barbershop_id: mongoose.Types.ObjectId;
  stamps: number;
  discount_in_numbers: number;
  campaign_duration: {
    start_date: Date;
    end_date: Date;
  };
  type: "Discounted" | "Free";
}

const CampaignSchema: Schema = new Schema<ICampaign>({
  campaign_name: {
    type: String,
    required: true,
    trim: true
  },
  barbershop_id: {
    type: Schema.Types.ObjectId,
    ref: "BarberShop",
    required: true
  },
  stamps: {
    type: Number,
    required: true,
    min: 0
  },
  discount_in_numbers: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  campaign_duration: {
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    }
  },
  type: {
    type: String,
    enum: ["Discounted", "Free"],
    required: true
  }
});

const Campaign = mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;
