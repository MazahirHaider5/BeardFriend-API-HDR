import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import contestRoutes from "./contest.routes";
import contestantRoutes from "../routes/contestant.routes";
import productRoutes from "../routes/product.routes";
import barberShopRoutes from "../routes/barbershop.routes";
import campaignRoutes from "../routes/campaign.routes";
import shopReviewRoutes from "../routes/shopReview.routes";
import productReviewRoutes from "../routes/productReview.routes";
import servicesRoutes from "../routes/services.routes";
import reservationRoutes from "../routes/reservations.routes";
import orderRoutes from "../routes/orders.routes";
import stampRoutes from "../routes/stamp.routes";
import payment from "../routes/payments.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/contest", contestRoutes);
router.use("/contestant", contestantRoutes);
router.use("/product", productRoutes);
router.use("/barbershop", barberShopRoutes);
router.use("/campaign", campaignRoutes);
router.use("/shopreview", shopReviewRoutes);
router.use("/reservation", reservationRoutes);
router.use("/productreview", productReviewRoutes);
router.use("/services", servicesRoutes);
router.use("/orders", orderRoutes);
router.use("/stamp", stampRoutes);
router.use("/payment", payment);

export default router;
