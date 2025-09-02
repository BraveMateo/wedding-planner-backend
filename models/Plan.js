import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema(
  {
    shareId: { type: String, unique: true, index: true },
    coupleNames: String,
    weddingDate: String,
    location: String,
    budget: String,
    notes: String,
    guests: String,
    vendors: String,
    invitations: String,
    aiPlan: String,
  },
  { timestamps: true }
);

const Plan = mongoose.model("Plan", PlanSchema);
export default Plan;
