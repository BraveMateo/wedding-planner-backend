import express from "express";
import Plan from "../models/Plan.js";
import { v4 as uuidv4 } from "uuid";
import Groq from "groq-sdk";

const router = express.Router();

// --- Helper to create Groq client only when needed ---
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Please check your .env file.");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// --- Prompt Builder ---
function buildPrompt(d) {
  return `
Inputs:
- Couple Names: ${d.coupleNames || "TBD"}
- Target Date: ${d.weddingDate || "TBD"}
- Location/Venue Preference: ${d.location || "TBD"}
- Budget: ${d.budget || "TBD"}
- Guest Count: ${d.guests || "Approx. 100"}
- Preferred Vendors / Notes: ${d.vendors || "Standard wedding vendors"}, ${
    d.notes || ""
  }

Output requirements:
- Write in a friendly, practical tone like a real wedding planner.
- Use this structure:

Phase 1: The Big Picture (9-12 Months Before)
1. Vision & Budget
2. Venue & Caterer
3. Photographer
4. DJ & Music

Phase 2: The Details (6-3 Months Before)
1. Vendor Finalization
2. Attire, Invitations, Rentals

Phase 3: Final Countdown (2 Months - Day Of)
1. Headcount & Seating
2. Confirmations
3. Example Day-Of Timeline

Sample Budget Breakdown (tailored to ${d.budget || "typical budgets"} and ${
    d.guests || "guest count"
  })

Finish with an encouraging note for ${d.coupleNames || "the couple"}.
Format output as clean text (no markdown fences).
  `;
}

// --- AI Generator ---
async function generateWeddingPlanAI(data) {
  try {
    const groq = getGroqClient(); // ✅ created here when called
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: buildPrompt(data) }],
      temperature: 0.7,
    });

    return (
      completion.choices?.[0]?.message?.content?.trim() ||
      "A wedding plan will appear here."
    );
  } catch (err) {
    console.error("Groq AI generation failed:", err.message || err);
    return "We couldn't generate the AI plan at the moment. Please try again later.";
  }
}

// --- Routes ---

// Create plan
router.post("/", async (req, res) => {
  try {
    const shareId = uuidv4().slice(0, 8);
    let aiPlan = await generateWeddingPlanAI(req.body);

    const plan = new Plan({ ...req.body, shareId, aiPlan });
    await plan.save();

    res.json({ shareId, aiPlan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Get plan
router.get("/:shareId", async (req, res) => {
  try {
    const plan = await Plan.findOne({ shareId: req.params.shareId });
    if (!plan) return res.status(404).json({ error: "Not found" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update plan (regenerate AI if needed)
router.put("/:shareId", async (req, res) => {
  try {
    let update = { ...req.body };

    if (req.query.regenAI === "true") {
      update.aiPlan = await generateWeddingPlanAI(req.body);
    }

    const plan = await Plan.findOneAndUpdate(
      { shareId: req.params.shareId },
      update,
      { new: true }
    );

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
