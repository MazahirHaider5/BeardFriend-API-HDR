import mongoose, { Schema, Document } from "mongoose";

export interface IContest extends Document {
  startDate: Date;
  endDate: Date;
  description: string;
  advantages: string;
  howTojoin: string;
  winner: Schema.Types.ObjectId;
  status: string;
  contestants: Schema.Types.ObjectId[];
}

const contestSchema = new mongoose.Schema<IContest>(
  {
    startDate: {
      type: Date,
      default: Date.now()
    },
    endDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: "description"
    },
    advantages: {
      type: String,
      default: "advantages"
    },
    howTojoin: {
      type: String,
      default: "how to join"
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contestant"
    },
    contestants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contestant"
      }
    ],
    status: {
      type: String,
      default: "ongoing",
      enum: ["ongoing", "expired"]
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IContest>("Contest", contestSchema);
