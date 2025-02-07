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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const users_model_js_1 = __importDefault(require("./models/users.model.js"));
const seedUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const uri = (_a = process.env.DB_CONNECTION_STRING) !== null && _a !== void 0 ? _a : "";
        yield mongoose_1.default.connect(uri);
        console.log("✅ Connected to the database");
        yield users_model_js_1.default.deleteMany({});
        console.log("✅ Existing users deleted");
        const users = [
            {
                email: "john.doe@example.com",
                username: "john_doe",
                name: "John Doe",
                phone: "1234567890",
                password: "password123",
                profilephoto: "https://example.com/profiles/john.jpg",
                coverphoto: "https://example.com/covers/john.jpg",
                role: "member",
                is_verified: true,
                language: "English",
                is_two_factor: false,
                is_email_notification: true,
                wishlist: [],
                address: {
                    city: "New York",
                    state: "NY",
                    country: "USA",
                    zip: "10001",
                    street: "123 Main St",
                },
            },
            {
                email: "jane.smith@example.com",
                username: "jane_smith",
                name: "Jane Smith",
                phone: "9876543210",
                password: "password123",
                profilephoto: "https://example.com/profiles/jane.jpg",
                role: "admin",
                is_verified: false,
                language: "French",
                is_two_factor: true,
                is_email_notification: false,
                wishlist: [
                    { refModel: "Product", refId: new mongoose_1.default.Types.ObjectId() },
                ],
                billing_address: {
                    city: "Los Angeles",
                    state: "CA",
                    country: "USA",
                    zip: "90001",
                    street: "456 Elm St",
                },
                shipping_address: {
                    city: "San Francisco",
                    state: "CA",
                    country: "USA",
                    zip: "94101",
                    street: "789 Pine St",
                },
            },
            {
                email: "jack.bradshaw@example.com",
                username: "jack_bradshaw",
                name: "Jack Bradshaw",
                phone: "98765467732",
                password: "password123",
                profilephoto: "https://example.com/profiles/jane.jpg",
                role: "barber",
                is_verified: false,
                language: "Italian",
                is_two_factor: true,
                is_email_notification: false,
                wishlist: [
                    { refModel: "Product", refId: new mongoose_1.default.Types.ObjectId() },
                ],
                billing_address: {
                    city: "Los Angeles",
                    state: "CA",
                    country: "USA",
                    zip: "90005",
                    street: "446 Nl St",
                },
                shipping_address: {
                    city: "San Francisco",
                    state: "CA",
                    country: "USA",
                    zip: "94101",
                    street: "789 Pine St",
                },
            },
        ];
        yield users_model_js_1.default.insertMany(users);
        console.log("✅ Sample users added successfully");
        yield mongoose_1.default.connection.close();
        console.log("✅ Database connection closed");
    }
    catch (error) {
        console.error("❌ Error seeding users:", error);
        process.exit(1);
    }
});
seedUsers();
