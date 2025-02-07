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
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_model_1 = __importDefault(require("../models/users.model"));
// Helper function to extract access token
const getAccessToken = (req) => {
    var _a;
    let token = req.cookies.accessToken;
    // Check for Bearer token in Authorization header
    if (!token && ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer "))) {
        token = req.headers.authorization.split(" ")[1];
    }
    return token;
};
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = getAccessToken(req);
    // Check if the token exists
    if (!token) {
        res.status(403).json({
            success: false,
            message: "Access token required"
        });
        return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({
            success: false,
            message: "JWT secret is not defined"
        });
        return;
    }
    try {
        // Verify and decode token with proper typing
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Fetch user from the database to ensure they still exist and are active
        const user = yield users_model_1.default.findById(decoded.id).select('-password');
        if (!user || !user.is_active || user.blocked) {
            res.status(401).json({
                success: false,
                message: "User not found or account is inactive"
            });
            return;
        }
        // Attach the full user object to the request
        req.user = user;
        next();
    }
    catch (error) {
        // Custom error handling for JWT issues
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: "Access token has expired"
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "An error occurred while verifying the access token",
            error: error.message
        });
        return;
    }
});
exports.verifyToken = verifyToken;
exports.default = exports.verifyToken;
