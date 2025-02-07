import { Router } from "express";
import {
  createContest,
  getAllContest,
  deleteContest,
  contestUpdate,
  getAdminOnGoingContest,
  getSingleContest,
  getRemainingTime
} from "../controllers/contest.controller";
import { verifyToken } from "../middleware/authenticate";

const router = Router();

router.post("/create", verifyToken, createContest);
router.get("/getall", verifyToken, getAllContest);
router.delete("/delete/:contestId", verifyToken, deleteContest);
router.put("/update", verifyToken, contestUpdate);
router.get("/getSingle/:contestId", verifyToken, getSingleContest);
router.get("/ongoing", getAdminOnGoingContest);
router.get("/remainingTime/:id", getRemainingTime);

export default router;
