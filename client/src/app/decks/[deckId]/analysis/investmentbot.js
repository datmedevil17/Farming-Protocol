// /analysis/investmentBot.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDeckHistory } from "../utils/deckHistory"; // Import the updated getDeckHistory function

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

router.post("/investment-query", async (req, res) => {
  const { deckId, question } = req.body;

  if (!deckId || !question) {
    return res.status(400).json({ message: "Deck ID and question are required." });
  }

  try {
    // Step 1: Fetch deck investment history from JSON file
    const deckHistory = await getDeckHistory(deckId);

    if (!deckHistory.length) {
      return res.status(404).json({ message: "No investment history found for the given deck." });
    }

    // Step 2: Format history data into a string for Gemini
    const historyString = deckHistory
      .map((item) => {
        const date = new Date(item.timestamp * 1000).toLocaleDateString();
        return `- ${item.amount} ETH on ${date}`;
      })
      .join("\n");

    // Step 3: Prepare the prompt for Gemini
    const prompt = `
      You are an investment advisor bot. Based on the following deck investment history, answer the user's question.
      Investment History:
      ${historyString}

      User question: "${question}"
      Provide a clear, balanced response considering risks, potential return, and time.
    `;

    // Step 4: Call Gemini API with the prepared prompt
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    res.status(200).json({ message: reply });

  } catch (err) {
    console.error("Gemini Flash error:", err);
    res.status(500).json({ message: "Failed to get response from Gemini Flash." });
  }
});

export default router;
