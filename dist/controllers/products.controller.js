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
exports.createProduct = void 0;
const products_model_1 = __importDefault(require("../models/products.model"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only jpeg and png images are allowed"));
        }
        cb(null, true);
    },
}).array("product_photos", 5); // 5 images are allowed to upload
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // image uploading
        upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err instanceof multer_1.default.MulterError) {
                res.status(400).json({ message: err.message });
                return;
            }
            const { product_name, product_description, product_price, product_instock, product_sold, total_products, product_discount, } = req.body;
            if (!product_name || !product_description || !product_price || !total_products) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields"
                });
                return;
            }
            if (product_price < 0) {
                res.status(400).json({
                    success: false,
                    message: "Product price cannot be negative"
                });
                return;
            }
            if (total_products < 0) {
                res.status(400).json({
                    success: false,
                    message: "Total products cannot be negative"
                });
                return;
            }
            const newProduct = new products_model_1.default({
                product_name,
                product_description,
                product_price,
                product_instock: product_instock !== null && product_instock !== void 0 ? product_instock : false,
                product_sold: product_sold !== null && product_sold !== void 0 ? product_sold : 0, // Default to 0 if not provided
                total_products,
                product_photos: req.files
                    ? req.files.map((file) => file.path)
                    : [],
                product_discount: product_discount !== null && product_discount !== void 0 ? product_discount : 0, // Default to 0 if not provided
            });
            yield newProduct.save();
            res.status(201).json({
                success: true,
                message: "Product created successfully",
                product: newProduct
            });
        }));
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create product, server error",
            error
        });
    }
});
exports.createProduct = createProduct;
