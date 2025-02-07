import { Router } from "express";
import createMulterUploader from "../config/multer";
import {
  getAllContestants,
  deleteContestant,
  addContestant,
  blockUnBlockContestParticipants,
  voteForParticipant,
  getTopContestants,
  getOlderWinner,
  updateContestant
} from "../controllers/contestant.controller";
import { verifyToken } from "../middleware/authenticate";

const upload = createMulterUploader(["image/jpeg", "image/png"], "contestants");
const router = Router();

router.get("/getAll", verifyToken, getAllContestants);
router.delete("/delete/:id", verifyToken, deleteContestant);
router.post("/add", verifyToken, upload.single("picture"), addContestant);
router.put("/blockUnblock/:id", verifyToken, blockUnBlockContestParticipants);
router.post("/vote", verifyToken, voteForParticipant);
router.get("/topSix/:id", getTopContestants);
router.get("/getOlderWinners", verifyToken, getOlderWinner);
router.put(
  "/update/:id",
  verifyToken,
  upload.single("picture"),
  updateContestant
);

export default router;
