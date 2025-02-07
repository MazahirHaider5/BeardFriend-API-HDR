import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  shop_id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  description: string;
}

const ServiceSchema: Schema = new Schema<IService>({
  shop_id: {
    type: Schema.Types.ObjectId,
    ref: "BarberShop",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
});

const Service = mongoose.model<IService>("Service", ServiceSchema);

export default Service;
