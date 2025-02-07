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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const AddressSchema = new mongoose_1.Schema({
    city: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String, required: false },
    zip: { type: String, required: false },
    street: { type: String, required: false }
});
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: false, unique: true },
    name: { type: String, required: false },
    phone: { type: String, required: false },
    password: { type: String, default: "" },
    profilephoto: { type: String },
    coverphoto: { type: String },
    stripe_customer_id: { type: String, default: null },
    role: {
        type: String,
        required: false,
        enum: ["member", "admin", "barber"],
        default: "member"
    },
    otp: { type: String, default: null },
    otp_expiry: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000)
    },
    is_verified: { type: Boolean, default: false },
    language: { type: String, default: "English" },
    is_two_factor: { type: Boolean, default: false },
    is_email_notification: { type: Boolean, default: false },
    DOB: { type: Date, required: false },
    address: AddressSchema,
    billing_address: AddressSchema,
    shipping_address: AddressSchema,
    wishlist: [
        {
            refModel: {
                type: String,
                enum: ["Product", "Shop"],
                required: true
            },
            refId: {
                type: mongoose_1.Schema.Types.ObjectId,
                required: true
            }
        }
    ],
    provider: { type: String, required: false },
    provider_id: { type: String, required: false },
    blocked: { type: Boolean, default: false },
    qr_code: { type: String, required: false },
    is_active: { type: Boolean, default: true }
});
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next();
        try {
            const salt = yield bcrypt_1.default.genSalt(10);
            this.password = yield bcrypt_1.default.hash(this.password, salt);
            next();
        }
        catch (error) {
            return next(error);
        }
    });
});
exports.default = mongoose_1.default.model("User", UserSchema);
