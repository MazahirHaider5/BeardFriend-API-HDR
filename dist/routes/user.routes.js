"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
// Admin routes
router.get('/getAllUsers', user_controller_1.getAllUsers); //admin
router.delete('/deleteUser/:id', user_controller_1.deleteUser); //admin
router.patch('/blockUnblockUser/:id', user_controller_1.toggleUserBlock); //admin
router.get('/getSingleUser/:id', user_controller_1.getUser);
router.patch('/updateUser/:id', user_controller_1.updateUser);
exports.default = router;
