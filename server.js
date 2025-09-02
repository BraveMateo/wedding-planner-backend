import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import planRoutes from "./routes/PlanRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Debug logs
console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded ✅" : "❌ Missing");
console.log(
  "GROQ_API_KEY:",
  process.env.GROQ_API_KEY ? "Loaded ✅" : "❌ Missing"
);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "❌ Missing");

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(helmet());

// Routes
app.use("/api/plans", planRoutes);
app.get("/health", (req, res) => res.json({ status: "OK" }));

// Start server
const PORT = process.env.PORT || 5000;
mongoose;
mongoose
  .connect(`${process.env.MONGO_URI}${process.env.MONGO_DB}`)
  .then(() => app.listen(PORT, () => console.log(`Backend running on ${PORT}`)))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
