import mongoose, { Schema, Document } from "mongoose";

export interface IBarberShop extends Document {
  user_id: mongoose.Types.ObjectId;
  user_role: string;
  barbershop_name: string;
  barbershop_seats: number;
  barbershop_address: string;
  barbershop_about: string;
  barbershop_languages: string;
  barbershop_images: string[];
  barbershop_staff: { user_id: mongoose.Types.ObjectId; name: string }[];
  reviews: Schema.Types.ObjectId[];
  services: Schema.Types.ObjectId[];
  barbershop_timing: {
    days: {
      mon_fri?: {
        active: boolean;
        opening_time?: string;
        closing_time?: string;
      };
      mon_sat?: {
        active: boolean;
        opening_time?: string;
        closing_time?: string;
      };
      full_week?: {
        active: boolean;
        opening_time?: string;
        closing_time?: string;
      };
      custom_days?: {
        days: string; // Example: ["Monday", "Tuesday", "Wednesday"]
        opening_time: string;
        closing_time: string;
      }[];
    };
  };
}

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

const BarberShopSchema: Schema = new Schema<IBarberShop>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  user_role: {
    type: String,
    required: true,
    ref: "User"
  },
  barbershop_name: {
    type: String,
    required: true
  },
  barbershop_seats: {
    type: Number,
    required: true
  },
  barbershop_address: {
    type: String,
    required: true
  },
  barbershop_about: {
    type: String,
    required: true
  },
  barbershop_languages: {
    type: String,
    required: true
  },
  barbershop_images: {
    type: [String],
    required: true
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopReview",
    },
  ],
  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    }
  ],
  barbershop_staff: [
    new Schema(
      {
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true }
      },
      { _id: false }
    )
  ],
  barbershop_timing: {
    days: {
      mon_fri: {
        type: new Schema(
          {
            active: { type: Boolean, required: true, default: false },
            opening_time: {
              type: String,
              validate: {
                validator: (value: string) => timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            },
            closing_time: {
              type: String,
              validate: {
                validator: (value: string) => timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            }
          },
          { _id: false }
        )
      },
      mon_sat: {
        type: new Schema(
          {
            active: { type: Boolean, required: true, default: false },
            opening_time: {
              type: String,
              validate: {
                validator: (value: string) => timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            },
            closing_time: {
              type: String,
              validate: {
                validator: (value: string) => timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            }
          },
          { _id: false }
        )
      },
      full_week: {
        type: new Schema(
          {
            active: { type: Boolean, required: true, default: false },
            opening_time: {
              type: String,
              validate: {
                validator: (value: string) => !value || timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            },
            closing_time: {
              type: String,
              validate: {
                validator: (value: string) => !value || timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            }
          },
          { _id: false }
        )
      },
      custom_days: {
        type: [
          {
            day: {
              type: String,
              required: true,
              validate: {
                validator: (value: string) => validDays.includes(value),
                message: "Invalid day. Use full day names like 'Monday'."
              }
            },
            opening_time: {
              type: String,
              required: true,
              validate: {
                validator: (value: string) => timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            },
            closing_time: {
              type: String,
              required: true,
              validate: {
                validator: (value: string) => timeRegex.test(value),
                message: "Invalid time format. Use 'HH:MM AM/PM'."
              }
            }
          }
        ],
        default: []
      }
    }
  }
});

export default mongoose.model<IBarberShop>("BarberShop", BarberShopSchema);
