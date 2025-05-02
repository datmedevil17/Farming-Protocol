import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import getUserInvestmentHistory from "../data/getUserInvestmentHistory.js";
import getAllDeckHistories from "../data/getAllDeckHistories.js";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

router.post("/recommend-deck", async (req, res) => {
  const { userId, preferences } = req.body;

  if (!userId || !preferences) {
    return res.status(400).json({ message: "Missing userId or preferences." });
  }

  try {
    // Load data
    const userHistory = await getUserInvestmentHistory(userId); // e.g., [{ deck: "GreenHarvest", amount: 10000, roi: 12 }]
    const allDecks = await getAllDeckHistories(); // e.g., [{ name, totalInvestment, averageROI, riskLevel, ... }]

    // Format for prompt
    const formattedHistory = userHistory.map(h => 
      `- ${h.deck}: ₹${h.amount} invested, ROI ${h.roi}%`
    ).join("\n");

    const formattedDecks = allDecks.map(d =>
      `- ${d.name}: ₹${d.totalInvestment} total invested, ROI ${d.averageROI}%, Risk: ${d.riskLevel}`
    ).join("\n");

    const prompt = `
You are a financial AI assistant.

User's investment preferences:
- Investment Amount: ₹${preferences.amount}
- Expected ROI: ${preferences.expectedROI}%
- Risk tolerance: ${preferences.riskTolerance}
- Preferred duration: ${preferences.duration}

User’s past investment history:
${formattedHistory}

Available decks:
${formattedDecks}

Based on the user's preferences, past behavior, and deck performance, recommend the BEST deck to invest in. Explain your reasoning clearly.
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return res.status(200).json({ recommendation: reply });
  } catch (err) {
    console.error("Gemini recommendation error:", err);
    return res.status(500).json({ message: "Failed to generate recommendation." });
  }
});

export default router;
