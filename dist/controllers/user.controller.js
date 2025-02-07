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
exports.toggleUserBlock = exports.deleteUser = exports.updateUser = exports.getUser = exports.getAllUsers = void 0;
const users_model_1 = __importDefault(require("../models/users.model"));
// Get all users (Admin only)
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield users_model_1.default.find()
            .select('-password -otp -otp_expiry')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});
exports.getAllUsers = getAllUsers;
// Get single user (Admin or Own User)
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_model_1.default.findById(req.params.id)
            .select('-password -otp -otp_expiry');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        // Check if user is trying to access their own profile or is admin
        if (!req.user || (req.user.role !== 'admin' && req.user._id !== req.params.id)) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to access this user profile'
            });
            return;
        }
        res.status(200).json({
            success: true,
            user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});
exports.getUser = getUser;
// Update user (Own User or Admin)
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fields that cannot be updated
        const restrictedFields = ['password', 'email', 'role', 'is_verified', 'is_active'];
        const updates = Object.keys(req.body);
        // Check for restricted fields
        const isRestrictedUpdate = updates.some(update => restrictedFields.includes(update));
        if (isRestrictedUpdate) {
            res.status(400).json({
                success: false,
                message: 'Cannot update restricted fields'
            });
            return;
        }
        // Check if user is trying to update their own profile or is admin
        if (!req.user || (req.user.role !== 'admin' && req.user._id !== req.params.id)) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this user profile'
            });
            return;
        }
        const user = yield users_model_1.default.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).select('-password -otp -otp_expiry');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});
exports.updateUser = updateUser;
// Delete user (Admin only)
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_model_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});
exports.deleteUser = deleteUser;
// Block/Unblock user (Admin only)
const toggleUserBlock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_model_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        user.blocked = !user.blocked;
        yield user.save();
        res.status(200).json({
            success: true,
            message: `User ${user.blocked ? 'blocked' : 'unblocked'} successfully`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling user block status',
            error: error.message
        });
    }
});
exports.toggleUserBlock = toggleUserBlock;
