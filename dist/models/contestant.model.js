"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ContestantSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    image: { type: String, required: true },
    votes: { type: Number, default: 0 },
    voters: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true });
exports.default = mongoose_1.default.model("Contestant", ContestantSchema);
