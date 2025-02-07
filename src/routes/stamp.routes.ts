import express from "express";
import {
    createStamp,
    getUserStamps
} from "../controllers/stamp.controller";
import { verifyToken } from "../middleware/authenticate";

const router = express.Router();

// Routes
router.post("/createStamp",verifyToken, createStamp);
router.get("/getUserStamps", verifyToken, getUserStamps);

export default router;
