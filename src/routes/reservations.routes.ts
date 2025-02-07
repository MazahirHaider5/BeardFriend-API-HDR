import { Router } from "express";
import {
  createReservation,
  updateReservation,
  deleteReservation,
  getAllShopSpecificReservation
} from "../controllers/reservations.controller";
import verifyToken from "../middleware/authenticate";

const router = Router();

router.post("/create", verifyToken, createReservation);
router.put("/update", updateReservation);
router.get(
  "/getAllShopSpecific/:barberShopId",

  getAllShopSpecificReservation
);
router.delete("/delete/:reservationId", deleteReservation);

export default router;
