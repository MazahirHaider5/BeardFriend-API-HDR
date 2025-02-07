import { Router } from "express";
import {
  createBarberShop,
  deleteBarberShop,
  getBarberShop,
  getAllBarberShops,
  updateBarberShop
} from "../controllers/barberShop.controller";
import createMulterUploader from "../config/multer";
import { verifyToken } from "../middleware/authenticate";

const router = Router();

const upload = createMulterUploader(["image/jpeg", "image/png"], "contestants");

router.post(
  "/createBarberShop",
  verifyToken,
  upload.array("barbershop_images", 10),
  createBarberShop
);
router.get("/getBarberShop/:id", getBarberShop);
router.get("/getAllBarberShops", getAllBarberShops);
router.patch(
  "/updateBarberShop/:id",
  verifyToken,
  upload.array("barbershop_images", 10),
  updateBarberShop
);
router.delete("/deleteBarberShop/:id", verifyToken, deleteBarberShop);

export default router;
