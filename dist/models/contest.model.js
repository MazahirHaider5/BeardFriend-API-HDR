"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const contestSchema = new mongoose_1.default.Schema({
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Contestant"
    },
    contestants: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Contestant"
        }
    ],
    status: {
        type: String,
        default: "ongoing",
        enum: ["ongoing", "expired"]
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model("Contest", contestSchema);
