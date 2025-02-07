import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import QRCode from "qrcode";

// Address schema
interface IAddress {
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  street?: string;
}

// Define the structure of the stamps array in the User model
interface IStamp {
  stamp_id: mongoose.Types.ObjectId;
  campaign_id: mongoose.Types.ObjectId;
  stamp_name: string;
  created_at: Date;
  campaign_name?: string; 
  barbershop_id: mongoose.Types.ObjectId;
  barbershop_name?: string;
  stamp_expired?:boolean; 
}

export interface IUser extends Document {
  email: string;
  username: string;
  name?: string;
  phone?: string;
  password?: string;
  profilephoto?: string;
  coverphoto?: string;
  stripe_customer_id?: string;
  role?: string;
  otp?: string;
  otp_expiry?: Date;
  is_verified: boolean;
  language: string;
  is_two_factor: boolean;
  show_notification: boolean;
  news_Updates: boolean;
  BD_gifts_via_mail: boolean;
  DOB?: Date;
  address?: IAddress;
  billing_address?: IAddress;
  shipping_address?: IAddress;
  wishlist: {
    products: { refId: mongoose.Types.ObjectId }[];
    shops: { refId: mongoose.Types.ObjectId }[];
  };
  provider?: string;
  provider_id?: string;
  blocked?: boolean;
  qr_code?: string;
  stamps?: IStamp[];
  photo?: string;
  last_transaction_id?: string;
}

// Address schema
const AddressSchema = new Schema<IAddress>({
  city: { type: String, required: false },
  state: { type: String, required: false },
  country: { type: String, required: false },
  zip: { type: String, required: false },
  street: { type: String, required: false },
});

// User schema
const UserSchema: Schema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: false, unique: true },
  name: { type: String, required: false },
  phone: { type: String, required: false },
  password: { type: String, default: "" },
  profilephoto: { type: String },
  coverphoto: { type: String },
  stripe_customer_id: { type: String, default: null },
  last_transaction_id: { type: String, default: null },
  role: {
    type: String,
    required: false,
    enum: ["member", "admin", "barber"],
    default: "member",
  },
  otp: { type: String, default: null },
  otp_expiry: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
  },
  is_verified: { type: Boolean, default: false },
  language: { type: String, default: "English" },
  is_two_factor: { type: Boolean, default: false },
  show_notification: { type: Boolean, default: false },
  news_Updates: { type: Boolean, default: false },
  BD_gifts_via_mail: { type: Boolean, default: false },
  DOB: { type: Date, required: false },
  address: AddressSchema,
  billing_address: AddressSchema,
  shipping_address: AddressSchema,
  wishlist: {
    products: {
      type: [
        {
          refId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Product",
          },
        },
      ],
      default: [],
    },
    shops: {
      type: [
        {
          refId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Shop",
          },
        },
      ],
      default: [],
    },
  },
  provider: { type: String, required: false },
  provider_id: { type: String, required: false },
  blocked: { type: Boolean, default: false },
  qr_code: { type: String, required: false, unique: true },
  stamps: {
    type: [
      {
        stamp_id: { type: Schema.Types.ObjectId, ref: "Stamp", required: true },
        stamp_name: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
        campaign_id: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
        campaign_name: { type: String, required: false },
        barbershop_id: { type: Schema.Types.ObjectId, ref: "BarberShop", required: true },
        barbershop_name: { type: String, required: false},
        stamp_expired: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
  photo: { type: String },
});

UserSchema.pre<IUser>("save", async function (next) {
  try {
    const qrData = this.email || this.id.toString();
    const qrCodeImage = await QRCode.toDataURL(qrData);
    this.qr_code = qrCodeImage;
  } catch (error) {
    return next(error as mongoose.CallbackError);
  }

  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(15);
      this.password = await bcrypt.hash(this.password as string, salt);
      next();
    } catch (error: any) {
      return next(error as mongoose.CallbackError);
    }
  } else {
    next();
  }
});

export default mongoose.model<IUser & Document>("User", UserSchema);