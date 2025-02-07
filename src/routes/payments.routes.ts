import express from "express";
import { createCheckoutSession, fetchCheckoutSessionDetails } from "../controllers/payments.controller";

import { verifyToken } from "../middleware/authenticate";;

const router = express.Router();

router.post("/checkout", verifyToken, createCheckoutSession);

router.get("/success",verifyToken, fetchCheckoutSessionDetails);

export default router;