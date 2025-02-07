"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("../config/multer"));
const contestant_controller_1 = require("../controllers/contestant.controller");
const upload = (0, multer_1.default)(["image/jpeg", "image/png"], "contestants");
const router = (0, express_1.Router)();
router.get("/getAll", contestant_controller_1.getAllContestants);
router.delete("/delete/:id", contestant_controller_1.deleteContestant);
router.post("/add", upload.single("picture"), contestant_controller_1.addContestant);
router.put("/block/:id", contestant_controller_1.blockUnBlockContestParticipants);
exports.default = router;
