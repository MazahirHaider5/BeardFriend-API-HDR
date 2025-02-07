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
exports.blockUnBlockContestParticipants = exports.addContestant = exports.getAllContestants = exports.deleteContestant = void 0;
const contestant_model_1 = __importDefault(require("../models/contestant.model"));
const contest_model_1 = __importDefault(require("../models/contest.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const users_model_1 = __importDefault(require("../models/users.model"));
const deleteContestant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contestantId = req.params.id;
    if (!mongoose_1.default.Types.ObjectId.isValid(contestantId)) {
        res.status(404).json({ message: "Invalid contestant id" });
        return;
    }
    try {
        const contest = yield contestant_model_1.default.findByIdAndDelete(contestantId);
        if (!contest) {
            res.status(404).json({ success: false, message: "contestant not found" });
            return;
        }
        res
            .status(200)
            .json({ success: true, message: "contestant deleted successfully" });
    }
    catch (error) {
        res
            .status(400)
            .json({ success: false, message: "error while deleting contestant" });
    }
});
exports.deleteContestant = deleteContestant;
const getAllContestants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contestId } = req.params;
        const contests = yield contest_model_1.default.findById(contestId);
        if (!contests) {
            res.status(404).json({ success: false, message: "No contests found" });
            return;
        }
        const contestants = yield contestant_model_1.default.find({ contestId: contestId });
        res.status(200).json({ success: true, data: contestants });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "failed to create a review", error });
    }
});
exports.getAllContestants = getAllContestants;
const addContestant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, contestId, name } = req.body;
    if (!user_id || !contestId || !req.file || !name) {
        res
            .status(400)
            .json({ success: false, message: "all fields are required" });
        return;
    }
    try {
        const user = yield users_model_1.default.findById(user_id);
        if (!user) {
            res.status(404).json({ success: false, message: "user does not exits" });
            return;
        }
        const contest = yield contest_model_1.default.findById(contestId);
        if (!contest) {
            res
                .status(404)
                .json({ success: false, message: "contest does not exits" });
            return;
        }
        const imagePath = `uploads/users/${req.file.filename}`;
        const existingParticipation = yield contestant_model_1.default.find({ user_id });
        if (existingParticipation) {
            for (const participate of existingParticipation) {
                const isalreadyParticipate = yield contest_model_1.default.findOne({
                    _id: contestId,
                    participants_id: participate._id
                });
                if (isalreadyParticipate) {
                    res.status(400).json({ message: " already participated" });
                    return;
                }
            }
        }
        // Create a new participation record
        const participation = yield contestant_model_1.default.create({
            user_id,
            image: imagePath,
            votes: 0
        });
        const updatedContest = yield contest_model_1.default.updateOne({ _id: contestId }, {
            $push: {
                contestants: participation._id
            }
        });
        res
            .status(200)
            .json({ message: "Participation created successfully", participation });
    }
    catch (error) {
        res
            .status(400)
            .json({ success: false, message: "error while participating" });
    }
});
exports.addContestant = addContestant;
const blockUnBlockContestParticipants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { action } = req.query;
        if (action == undefined) {
            res.status(400).json({ message: "action query parameter is required" });
            return;
        }
        const user = yield contestant_model_1.default.findById(id);
        if (!user) {
            res.status(404).json({ message: "Participant not found" });
            return;
        }
        if (action === "block") {
            if (user.isBlocked) {
                res.status(400).json({ message: "Participant is already blocked" });
                return;
            }
            user.isBlocked = true;
        }
        else if (action === "unblock") {
            if (!user.isBlocked) {
                res.status(400).json({ message: "Participant is already unblocked" });
                return;
            }
            user.isBlocked = false;
        }
        else {
            res.status(400).json({ message: "Invalid action" });
            return;
        }
        yield user.save();
        const statusMessage = user.isBlocked ? "blocked" : "unblocked";
        res
            .status(200)
            .json({ message: `Participant ${statusMessage} successfully` });
    }
    catch (error) {
        console.error("Error toggling participant status:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});
exports.blockUnBlockContestParticipants = blockUnBlockContestParticipants;
