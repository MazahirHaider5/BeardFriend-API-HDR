// auth.routes.ts
import { Router } from "express";
import { register, verifyEmail, resendEmailVerificationOtp, login, logout, requestOtp, verifyOtp, resetPassword, googleAuth, googleAuthCallback, facebookAuth, facebookAuthCallback } from "../controllers/auth.controller";

const router = Router();

// Basic auth routes
router.post("/register", register);
// email verifaication
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-otp', resendEmailVerificationOtp);

router.post("/login", login);
router.post("/logout", logout);

// Password reset flow
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Social auth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookAuthCallback);

export default router;