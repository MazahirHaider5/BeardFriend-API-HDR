import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct
} from "../controllers/products.controller";
import createMulterUploader from "../config/multer";
import { verifyToken } from "../middleware/authenticate";

const router = Router();

const upload = createMulterUploader(["image/jpeg", "image/png"], "contestants");

router.post(
  "/createProduct",
  verifyToken,
  upload.array("product_photos", 5),
  createProduct
);
router.get("/getProducts", getProducts);
router.patch(
  "/updateProduct/:id",
  verifyToken,
  upload.array("product_photos", 5),
  updateProduct
);
router.delete("/deleteProduct/:id", verifyToken, deleteProduct);

export default router;
