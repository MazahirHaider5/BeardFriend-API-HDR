"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const createMulterUploader = (allowedTypes, uploadFolder) => {
    const ensureDirectoryExists = (folderPath) => {
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath, { recursive: true }); // Create directory if it doesn't exist
        }
    };
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path_1.default.join("uploads", uploadFolder);
            ensureDirectoryExists(uploadPath); // Ensure directory exists
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const fileExtension = path_1.default.extname(file.originalname);
            const filename = `${Date.now()}${fileExtension}`;
            cb(null, filename);
        }
    });
    const fileFilter = (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}.`), false);
        }
    };
    return (0, multer_1.default)({ storage, fileFilter });
};
exports.default = createMulterUploader;
