"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// Basic auth routes
router.post("/register", auth_controller_1.register);
// email verifaication
router.post('/verify-email', auth_controller_1.verifyEmail);
router.post('/resend-verification-otp', auth_controller_1.resendEmailVerificationOtp);
router.post("/login", auth_controller_1.login);
router.post("/logout", auth_controller_1.logout);
// Password reset flow
router.post("/request-otp", auth_controller_1.requestOtp);
router.post("/verify-otp", auth_controller_1.verifyOtp);
router.post("/reset-password", auth_controller_1.resetPassword);
// Social auth routes
router.get("/google", auth_controller_1.googleAuth);
router.get("/google/callback", auth_controller_1.googleAuthCallback);
router.get("/facebook", auth_controller_1.facebookAuth);
router.get("/facebook/callback", auth_controller_1.facebookAuthCallback);
exports.default = router;
