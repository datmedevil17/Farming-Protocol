// app/api/decks/[deckId]/analyze/route.js
import { NextResponse } from 'next/server';
import { getDeckHistory } from '@/lib/utils'; // Ensure this works correctly
import axios from 'axios';

// --- Placeholder getDeckHistory (replace with your actual implementation) ---
const getDeckHistory = async (deckId) => {
 console.warn(`getDeckHistory(${deckId}) called - using placeholder data`);
 // Example: Fetch from DB or another source based on deckId
 // Data should ideally have timestamps or sequential order
 return [
     { timestamp: '2023-10-01', tvl: 10000, profit: 0, investors: 5, date: new Date('2023-10-01').getTime() },
     { timestamp: '2023-11-01', tvl: 12500, profit: 500, investors: 7, date: new Date('2023-11-01').getTime() },
     { timestamp: '2023-12-01', tvl: 11800, profit: 850, investors: 6, date: new Date('2023-12-01').getTime() },
     { timestamp: '2024-01-01', tvl: 15200, profit: 1200, investors: 8, date: new Date('2024-01-01').getTime() },
     { timestamp: '2024-02-01', tvl: 16500, profit: 1500, investors: 9, date: new Date('2024-02-01').getTime() },
 ];
};
// --- End Placeholder ---


export async function GET(req, { params }) {
  const { deckId } = params;

  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable not set.");
    return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
  }
   if (!deckId) {
     return NextResponse.json({ error: 'Deck ID is required' }, { status: 400 });
   }

  try {
    // Step 1: Get deck history
    console.log(`Fetching history for deck ID: ${deckId}`);
    const deckHistory = await getDeckHistory(deckId);

    if (!deckHistory || !Array.isArray(deckHistory) || deckHistory.length === 0) {
        console.log(`No history found or invalid history data for deck ID: ${deckId}`);
        // Return structure consistent with success, but indicating no data
        return NextResponse.json({
            deckId,
            analysis: { // Use object structure
                summary: "No historical data available to generate analysis.",
                insights: [],
                trends: "N/A",
                riskAssessment: "N/A",
                recommendation: "Cannot recommend without data.",
                graphData: { tvl: [], profit: [], investors: [] }
            }
        });
    }

    // Step 2: Create a prompt asking for JSON output including graph data
    // Note: Timestamps are crucial for time-series graphs. Ensure getDeckHistory provides them.
    // We use 'date' (unix timestamp) for easier sorting/plotting if 'timestamp' is just a string label.
    const historyForPrompt = deckHistory.map(h => ({
        date: h.timestamp || new Date(h.date).toISOString().split('T')[0], // Prefer timestamp string if available, else format date
        tvl: h.tvl,
        profit: h.profit,
        investors: h.investors
    }));


    const prompt = `
      Analyze the following investment deck history data for Deck ID ${deckId}:
      ${JSON.stringify(historyForPrompt, null, 2)}

      Based *only* on the provided history data, generate a JSON object containing the following keys:
      - "summary": (String) A brief overview of the deck's performance trends (TVL, profit, investors). Max 3 sentences.
      - "insights": (Array of Strings) 2-4 key investment insights derived *directly* from the data trends.
      - "trends": (String) A short description of noticeable overall trends (e.g., growth, stagnation, volatility).
      - "riskAssessment": (String) A preliminary risk assessment based *solely* on the historical volatility observed in the data (e.g., "Low Volatility Observed", "Moderate Growth with Fluctuations", "High Volatility / Recent Decline"). State this is based only on history.
      - "recommendation": (String) A brief investment recommendation (e.g., "Leans positive based on growth", "Caution advised due to volatility", "Insufficient trend data") with a one-sentence reason based *strictly* on the provided historical data.
      - "graphData": (Object) An object containing data arrays for graphs:
          - "tvl": (Array of Objects) Array with { date: "YYYY-MM-DD", value: number } for Total Value Locked over time.
          - "profit": (Array of Objects) Array with { date: "YYYY-MM-DD", value: number } for Profit Generated over time.
          - "investors": (Array of Objects) Array with { date: "YYYY-MM-DD", value: number } for Investor Count over time.

      Ensure the ENTIRE output is a single, valid JSON object. Use the dates provided in the input history for the graphData arrays.
    `;

    // Step 3: Call Gemini API
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    console.log(`Calling Gemini API for deck ID: ${deckId} analysis and graph data.`);
    const geminiRes = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            // Potentially useful if model supports forcing JSON output:
            // responseMimeType: "application/json",
            maxOutputTokens: 1500, // Increase if needed for larger histories/data
            temperature: 0.4 // Lower temp for more factual, structured output
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Step 4: Extract and PARSE the analysis result AS JSON
    const rawText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw new Error("No analysis text provided by the model.");
    }

    let analysisResult;
    try {
        // Attempt to parse the entire response as JSON
        // Sometimes Gemini might add ```json markdown, remove it
        const cleanedText = rawText.replace(/^```json\s*|```$/g, '').trim();
        analysisResult = JSON.parse(cleanedText);
        console.log(`Successfully parsed Gemini JSON response for deck ID: ${deckId}`);

        // Basic validation of expected structure
        if (!analysisResult.summary || !analysisResult.graphData?.tvl) {
             console.warn("Parsed JSON missing expected keys for deck:", deckId);
             // Provide default structure on partial failure
             analysisResult = {
                 summary: analysisResult.summary || "Analysis generated, but structure might be incomplete.",
                 insights: analysisResult.insights || [],
                 trends: analysisResult.trends || "N/A",
                 riskAssessment: analysisResult.riskAssessment || "N/A",
                 recommendation: analysisResult.recommendation || "N/A",
                 graphData: analysisResult.graphData || { tvl: [], profit: [], investors: [] }
             };
        }

    } catch (parseError) {
        console.error(`Failed to parse Gemini response as JSON for deck ${deckId}:`, parseError);
        console.error("Raw Gemini Response Text:", rawText); // Log the raw text for debugging
        // Fallback: Return the raw text with an error indicator
        analysisResult = {
            summary: "Failed to parse analysis from AI. Raw text might be available.",
            rawText: rawText, // Include raw text for debugging on client if needed
            insights: [],
            trends: "Error",
            riskAssessment: "Error",
            recommendation: "Error",
            graphData: { tvl: [], profit: [], investors: [] }
        };
    }

    // Step 5: Send structured response back to frontend
    return NextResponse.json({ deckId, analysis: analysisResult }); // Send the parsed object

  } catch (err) {
     // Handle Axios errors or other exceptions
     console.error(`Error generating analysis for deck ${deckId}:`, err.response?.data || err.message || err);
     const errorMessage = err.response?.data?.error?.message || 'Failed to generate deck analysis';
     const statusCode = err.response?.status || 500;
     // Return error in the same structure if possible
     return NextResponse.json({
         deckId,
         error: errorMessage,
         analysis: { // Provide empty structure on error
             summary: `Error: ${errorMessage}`,
             insights: [],
             trends: "Error",
             riskAssessment: "Error",
             recommendation: "Error",
             graphData: { tvl: [], profit: [], investors: [] }
         }
     }, { status: statusCode });
  }
}