"use strict";
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
exports.getSingleContest = exports.contestUpdate = exports.deleteContest = exports.getAllContest = exports.createContest = void 0;
const contest_model_1 = __importDefault(require("../models/contest.model"));
const luxon_1 = require("luxon");
const mongoose_1 = __importDefault(require("mongoose"));
const createContest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { startDate, endDate, description, advantages, howTojoin } = req.body;
        if (!startDate || !endDate) {
            res.status(400).json({ success: false, message: "fields arre missing" });
            return;
        }
        startDate = new Date(startDate);
        endDate = new Date(endDate);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(0, 0, 0, 0);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res
                .status(400)
                .json({ message: "Invalid date format for startDate or endDate" });
            return;
        }
        if (startDate > endDate) {
            res
                .status(400)
                .json({ message: "Start date cannot be greater than end date" });
            return;
        }
        let currentDateTime = new Date();
        currentDateTime.setUTCHours(0, 0, 0, 0);
        if (currentDateTime > new Date(startDate)) {
            res
                .status(400)
                .json({ message: "Start date must be Present & in the future" });
            return;
        }
        const check = yield contest_model_1.default.find({ status: "ongoing" });
        if (check.length) {
            res.status(400).json({
                message: "You won't be able to add a new contest as the already ongoing contest has not ended"
            });
            return;
        }
        const contest = new contest_model_1.default({
            startDate,
            endDate
        });
        if (description) {
            contest.description = description;
        }
        if (advantages) {
            contest.advantages = advantages;
        }
        if (howTojoin) {
            contest.howTojoin = howTojoin;
        }
        yield contest.save();
        res.status(201).json({ message: "Contest created successfully", contest });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create contest", error });
        return;
    }
});
exports.createContest = createContest;
const getAllContest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contests = yield contest_model_1.default.find();
        if (!contests) {
            res.status(404).json({ success: true, message: "No contests found" });
            return;
        }
        res.status(200).json({ success: true, data: contests });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "failed to create a review", error });
    }
});
exports.getAllContest = getAllContest;
const deleteContest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contestId = req.params.contestId;
    if (!mongoose_1.default.Types.ObjectId.isValid(contestId)) {
        res.status(404).json({ message: "Invalid contest id" });
        return;
    }
    try {
        const contest = yield contest_model_1.default.findByIdAndDelete(contestId);
        if (!contest) {
            res.status(404).json({ success: false, message: "contest not found" });
            return;
        }
        res
            .status(200)
            .json({ success: true, message: "contest deleted successfully" });
    }
    catch (error) {
        res
            .status(400)
            .json({ success: false, message: "error while deleting contest" });
    }
});
exports.deleteContest = deleteContest;
const contestUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, description, advantages, howTojoin, contestId } = req.body;
    try {
        // Validate required fields
        if (!startDate ||
            !endDate ||
            !description ||
            !advantages ||
            !howTojoin ||
            !contestId) {
            res
                .status(400)
                .json({ success: false, message: "Incomplete contest details" });
            return;
        }
        // Validate date format and logic
        const start = luxon_1.DateTime.fromISO(startDate);
        const end = luxon_1.DateTime.fromISO(endDate);
        const now = luxon_1.DateTime.now();
        if (!start.isValid || !end.isValid) {
            res.status(400).json({
                success: false,
                message: "Invalid date format for startDate or endDate"
            });
            return;
        }
        if (start >= end) {
            res.status(400).json({
                success: false,
                message: "startDate cannot be greater than or equal to endDate"
            });
            return;
        }
        if (now > start) {
            res.status(400).json({
                success: false,
                message: "Start date must be in the present or future"
            });
            return;
        }
        // Check if the contest exists
        const contest = yield contest_model_1.default.findById(contestId);
        if (!contest) {
            res
                .status(404)
                .json({ success: false, message: "No such contest found" });
            return;
        }
        // Convert Luxon DateTime to JavaScript Date
        const startDateNative = start.toJSDate();
        const endDateNative = end.toJSDate();
        // Update the contest
        const updatedContest = yield contest_model_1.default.findByIdAndUpdate(contestId, {
            startDate: startDateNative,
            endDate: endDateNative,
            description,
            advantages,
            howTojoin
        }, { new: true });
        res.status(200).json({
            success: true,
            message: "Successfully updated",
            data: updatedContest
        });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "An unexpected error occurred" });
    }
});
exports.contestUpdate = contestUpdate;
const getSingleContest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contestId = req.params.contestId;
    if (!mongoose_1.default.Types.ObjectId.isValid(contestId)) {
        res.status(404).json({ message: "Invalid contest id" });
        return;
    }
    try {
        const contest = yield contest_model_1.default.findOne({ _id: contestId });
        if (!contest) {
            res.status(404).json({ success: false, message: "contest not found" });
            return;
        }
        res.status(200).json({ success: true, message: contest });
    }
    catch (error) {
        res
            .status(400)
            .json({ success: false, message: "error while retriving contest" });
    }
});
exports.getSingleContest = getSingleContest;
