import mongoose, { Schema, Document } from "mongoose";

export interface IReservation extends Document {
  user_id: mongoose.Types.ObjectId;
  barber_shop_id: mongoose.Types.ObjectId;
  reservation_time_slot: Date;
  reservation_approval: boolean;
}
const ReservationSchema: Schema = new Schema<IReservation>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    barber_shop_id: {
      type: Schema.Types.ObjectId,
      ref: "BarberShop",
      required: true
    },
    reservation_time_slot: {
      type: Date,
      required: true
    },
    reservation_approval: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IReservation>("Reservation", ReservationSchema);
