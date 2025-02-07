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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Session and passport setup
app.use((0, express_session_1.default)({
    secret: (_a = process.env.SESSION_SECRET) !== null && _a !== void 0 ? _a : "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((0, helmet_1.default)());
// CORS setup
const allowedOrigins = (_c = (_b = process.env.ALLOWED_ORIGINS) === null || _b === void 0 ? void 0 : _b.split(",")) !== null && _c !== void 0 ? _c : [];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(rateLimiter_1.rateLimit);
// Routes
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running" });
});
app.use("/api", routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});
// Database connection and server start
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default)();
        const server = app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
        process.on("SIGTERM", () => gracefulShutdown(server));
        process.on("SIGINT", () => gracefulShutdown(server));
    }
    catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
});
const gracefulShutdown = (server) => {
    return () => {
        console.log("Server is shutting down...");
        server.close((err) => {
            if (err) {
                console.error("Error during server shutdown:", err);
                process.exit(1);
            }
            process.exit(0);
        });
    };
};
// Handle uncaught errors
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});
startServer();
