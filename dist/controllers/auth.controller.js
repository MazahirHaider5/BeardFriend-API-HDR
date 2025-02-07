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
exports.logout = exports.resetPassword = exports.verifyOtp = exports.requestOtp = exports.facebookAuthCallback = exports.facebookAuth = exports.googleAuthCallback = exports.googleAuth = exports.login = exports.resendEmailVerificationOtp = exports.verifyEmail = exports.register = void 0;
const bcrytp_1 = require("../utils/bcrytp");
const jwt_1 = require("../utils/jwt");
const users_model_1 = __importDefault(require("../models/users.model"));
const mailer_1 = require("../utils/mailer");
const otp_1 = require("../utils/otp");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ["profile", "email"]
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        let user = yield users_model_1.default.findOne({
            provider: "google",
            provider_id: profile.id
        });
        if (!user) {
            user = yield users_model_1.default.create({
                email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                name: profile.displayName,
                provider: "google",
                provider_id: profile.id,
                profilephoto: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
                is_verified: true,
                is_active: true
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
})));
passport_1.default.use(new passport_facebook_1.Strategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ["id", "emails", "name", "photos"]
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        let user = yield users_model_1.default.findOne({
            provider: "facebook",
            provider_id: profile.id
        });
        if (!user) {
            user = yield users_model_1.default.create({
                email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                name: `${(_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName} ${(_d = profile.name) === null || _d === void 0 ? void 0 : _d.familyName}`,
                provider: "facebook",
                provider_id: profile.id,
                profilephoto: (_f = (_e = profile.photos) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value,
                is_verified: true,
                is_active: true
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
})));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_model_1.default.findById(id);
        if (!user) {
            return done(new Error("User not found"), null);
        }
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
}));
// Register new user
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, username } = req.body;
    if (!email || !password) {
        res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
        return;
    }
    try {
        const existingUser = yield users_model_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
            return;
        }
        // Generate OTP
        const otp = (0, otp_1.generateOtp)();
        // Create user with unverified status
        const user = yield users_model_1.default.create({
            username,
            email,
            password: password,
            otp,
            otp_expiry: new Date(Date.now() + 90 * 1000), // 90 seconds expiry
        });
        yield (0, mailer_1.sendMail)(email, "Email Verification OTP", `Your OTP for email verification is: ${otp}. It will expire in 90 seconds.`);
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.otp;
        res.status(201).json({
            success: true,
            message: "Please verify your email using the OTP sent to your email address",
            user: userResponse
        });
        return;
    }
    catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
        return;
    }
});
exports.register = register;
// Verify OTP to verify account
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        });
        return;
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        if (user.is_verified) {
            res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
            return;
        }
        if (user.otp !== otp) {
            res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
            return;
        }
        if (user.otp_expiry && new Date() > user.otp_expiry) {
            res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one"
            });
            return;
        }
        // Verify and activate the user
        user.is_verified = true;
        user.is_active = true;
        user.otp = undefined;
        user.otp_expiry = undefined;
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
        return;
    }
    catch (error) {
        console.error("Error during email verification:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
        return;
    }
});
exports.verifyEmail = verifyEmail;
const resendEmailVerificationOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({
            success: false,
            message: "Email is required"
        });
        return;
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        if (user.is_verified) {
            res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
            return;
        }
        // Generate new OTP
        const otp = (0, otp_1.generateOtp)();
        user.otp = otp;
        user.otp_expiry = new Date(Date.now() + 90 * 1000);
        yield user.save();
        // Send new verification email
        yield (0, mailer_1.sendMail)(email, "Email Verification OTP", `Your new OTP for email verification is: ${otp}. It will expire in 90 seconds.`);
        res.status(200).json({
            success: true,
            message: "New OTP sent successfully"
        });
        return;
    }
    catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
        return;
    }
});
exports.resendEmailVerificationOtp = resendEmailVerificationOtp;
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
        return;
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        if (user.blocked || !user.is_active) {
            res.status(403).json({
                success: false,
                message: "Account is blocked or inactive"
            });
            return;
        }
        const passwordMatch = yield (0, bcrytp_1.comparePassword)(password, (_a = user.password) !== null && _a !== void 0 ? _a : "");
        if (!passwordMatch) {
            res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
            return;
        }
        const userPayload = user.toObject();
        delete userPayload.password;
        const accessToken = (0, jwt_1.generateAccessToken)(userPayload);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: userPayload
        });
        return;
    }
    catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
        return;
    }
});
exports.login = login;
// Google OAuth routes
exports.googleAuth = passport_1.default.authenticate("google", {
    scope: ["profile", "email"]
});
const googleAuthCallback = (req, res) => {
    passport_1.default.authenticate("google", (err, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (err || !user) {
            return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
        }
        try {
            const accessToken = (0, jwt_1.generateAccessToken)(user);
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000
            });
            return res.redirect(`${process.env.CLIENT_URL}/auth/success`);
        }
        catch (error) {
            console.error("Error in Google auth callback:", error);
            return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
        }
    }))(req, res);
};
exports.googleAuthCallback = googleAuthCallback;
// Facebook OAuth routes
exports.facebookAuth = passport_1.default.authenticate("facebook", {
    scope: ["email"]
});
const facebookAuthCallback = (req, res) => {
    passport_1.default.authenticate("facebook", (err, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (err || !user) {
            return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
        }
        try {
            const accessToken = (0, jwt_1.generateAccessToken)(user);
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000
            });
            return res.redirect(`${process.env.CLIENT_URL}/auth/success`);
        }
        catch (error) {
            console.error("Error in Facebook auth callback:", error);
            return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
        }
    }))(req, res);
};
exports.facebookAuthCallback = facebookAuthCallback;
// Password reset flow
const requestOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({
            success: false,
            message: "Email is required"
        });
        return;
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        const otp = (0, otp_1.generateOtp)();
        user.otp = otp;
        user.otp_expiry = new Date(Date.now() + 90 * 1000); // 90 seconds expiry
        yield user.save();
        yield (0, mailer_1.sendMail)(email, "Password Reset OTP", `Your OTP for password reset is: ${otp}. It will expire in 90 seconds.`);
        res.status(200).json({
            success: true,
            message: "OTP sent to email"
        });
        return;
    }
    catch (error) {
        console.error("Error requesting OTP:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return;
    }
});
exports.requestOtp = requestOtp;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        });
        return;
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        if (user.otp !== otp) {
            res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
            return;
        }
        if (user.otp_expiry && new Date() > user.otp_expiry) {
            res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
            return;
        }
        user.is_verified = true;
        yield user.save();
        res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });
        return;
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return;
    }
});
exports.verifyOtp = verifyOtp;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        res.status(400).json({
            success: false,
            message: "Email and new password are required"
        });
        return;
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }
        if (!user.is_verified) {
            res.status(400).json({
                success: false,
                message: "OTP not verified"
            });
            return;
        }
        user.password = newPassword;
        user.otp = undefined;
        user.otp_expiry = undefined;
        user.is_verified = false;
        yield user.save();
        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
        return;
    }
    catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return;
    }
});
exports.resetPassword = resetPassword;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
        return;
    }
    catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
        return;
    }
});
exports.logout = logout;
