import mongoose, { Schema, Document } from "mongoose";

export interface IContestant extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  name: string;
  image: string;
  votes: number;
  contestId: Schema.Types.ObjectId;
  isBlocked: boolean;
  voters: Schema.Types.ObjectId[];
}

const ContestantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    image: { type: String, required: true },
    votes: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);
export default mongoose.model<IContestant>("Contestant", ContestantSchema);
