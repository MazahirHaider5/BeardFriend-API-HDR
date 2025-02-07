import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { rateLimit } from "./middleware/rateLimiter";
import passport from "passport";
import session from "express-session";
import connectDB from "./config/db";
import path from "path";
import { createServer } from "http";
import {handleStripeWebhook} from "./utils/stripeWebHooks";

dotenv.config();

const app = express();

// Use the webhook router for Stripe webhook events
//Hey! should be before the session and passport setup because it needs to be raw and not json incase we keep it below the session and passport setup it will not work and throw an error
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Session and passport setup
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(helmet());

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit);
app.use(
  "/uploads/contestants",
  express.static(path.join(__dirname, "..", "uploads", "contestants"))
);

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});
app.use("/", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found."
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await connectDB(); 
    const server = createServer(app); 
    const port = process.env.PORT ?? 4000;
    
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => gracefulShutdown(server));
    process.on("SIGINT", () => gracefulShutdown(server));

  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1); 
  }
};

const gracefulShutdown = (server: any) => {
  console.log("Server is shutting down...");
  server.close((err: any) => {
    if (err) {
      console.error("Error during server shutdown:", err);
      process.exit(1); // Force exit if the server fails to shut down
    }

    console.log("Server closed successfully.");
    process.exit(0); 
  });
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