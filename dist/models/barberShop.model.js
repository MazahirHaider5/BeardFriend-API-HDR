"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
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
const BarberShopSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user_role: {
        type: String,
        required: true,
        ref: "User",
        enum: ["member", "admin", "barber"] // Defined as per User.user_role
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
    barbershop_staff: [
        new mongoose_1.Schema({
            user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
            name: { type: String, required: true }
        }, { _id: false })
    ],
    barbershop_timing: {
        days: {
            mon_fri: {
                type: new mongoose_1.Schema({
                    active: { type: Boolean, required: true, default: false },
                    opening_time: {
                        type: String,
                        validate: {
                            validator: (value) => timeRegex.test(value),
                            message: "Invalid time format. Use 'HH:MM AM/PM'."
                        }
                    },
                    closing_time: {
                        type: String,
                        validate: {
                            validator: (value) => timeRegex.test(value),
                            message: "Invalid time format. Use 'HH:MM AM/PM'."
                        }
                    }
                }, { _id: false })
            },
            mon_sat: {
                type: new mongoose_1.Schema({
                    active: { type: Boolean, required: true, default: false },
                    opening_time: {
                        type: String,
                        validate: {
                            validator: (value) => timeRegex.test(value),
                            message: "Invalid time format. Use 'HH:MM AM/PM'."
                        }
                    },
                    closing_time: {
                        type: String,
                        validate: {
                            validator: (value) => timeRegex.test(value),
                            message: "Invalid time format. Use 'HH:MM AM/PM'."
                        }
                    }
                }, { _id: false })
            },
            full_week: {
                type: new mongoose_1.Schema({
                    active: { type: Boolean, required: true, default: false },
                    opening_time: {
                        type: String,
                        validate: {
                            validator: (value) => !value || timeRegex.test(value),
                            message: "Invalid time format. Use 'HH:MM AM/PM'."
                        }
                    },
                    closing_time: {
                        type: String,
                        validate: {
                            validator: (value) => !value || timeRegex.test(value),
                            message: "Invalid time format. Use 'HH:MM AM/PM'."
                        }
                    }
                }, { _id: false })
            },
            custom_days: {
                type: [
                    {
                        day: {
                            type: String,
                            required: true,
                            validate: {
                                validator: (value) => validDays.includes(value),
                                message: "Invalid day. Use full day names like 'Monday'."
                            }
                        },
                        opening_time: {
                            type: String,
                            required: true,
                            validate: {
                                validator: (value) => timeRegex.test(value),
                                message: "Invalid time format. Use 'HH:MM AM/PM'."
                            }
                        },
                        closing_time: {
                            type: String,
                            required: true,
                            validate: {
                                validator: (value) => timeRegex.test(value),
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
exports.default = mongoose_1.default.model("BarberShop", BarberShopSchema);
