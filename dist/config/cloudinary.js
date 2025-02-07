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
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
});
const uploadImageCloudinary = (image) => __awaiter(void 0, void 0, void 0, function* () {
    if (!image) {
        throw new Error("No image provided for upload.");
    }
    const buffer = image.buffer;
    const uploadedImage = yield new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: "binkeyit" }, (error, result) => {
            if (error) {
                return reject(new Error(`Cloudinary upload failed: ${error.message}`));
            }
            if (!result) {
                return reject(new Error("Cloudinary upload returned no result."));
            }
            resolve(result);
        });
        uploadStream.end(buffer);
    });
    return uploadedImage;
});
exports.default = uploadImageCloudinary;
