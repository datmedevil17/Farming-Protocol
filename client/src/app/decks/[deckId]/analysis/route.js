// app/api/decks/[deckId]/analyze/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from '@/lib/wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { mapContractDataToDeck, fetchPlatformTokenDetails, formatBalance } from '@/lib/utils'; // Use existing utils

// --- NO getDeckHistory needed ---

export async function GET(req, { params }) {
  const { deckId } = params;

  // 1. Check API Key
  if (!process.env.GEMINI_API_KEY) {
    console.error("API Route Error: GEMINI_API_KEY environment variable not set.");
    return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
  }

  // 2. Validate Deck ID
  if (deckId === undefined || deckId === null || deckId === '') { return NextResponse.json({ error: 'Deck ID required' }, { status: 400 }); }
  const numericDeckId = Number(deckId);
  if (isNaN(numericDeckId)) { return NextResponse.json({ error: 'Invalid Deck ID format' }, { status: 400 }); }

  try {
    // --- Step 1: Fetch CURRENT Deck Info ---
    console.log(`API Route: Fetching current info for deck ID: ${numericDeckId}`);

    // Determine chainId (use first configured chain as default)
    if (!wagmiConfig || !wagmiConfig.chains || wagmiConfig.chains.length === 0) { throw new Error("Wagmi config chains not found."); }
    const chainId = wagmiConfig.chains[0].id;
    console.log(`API Route: Using chainId ${chainId}`);

    if (!investmentDeckManagerAddress) { throw new Error("Investment Manager Address not configured."); }

    // Fetch token details first
    const tokenDetails = await fetchPlatformTokenDetails(chainId);

    // Fetch current deck data
    const deckDataRaw = await readContract(wagmiConfig, {
        address: investmentDeckManagerAddress, abi: investmentDeckManagerABI,
        functionName: 'getDeckInfo', args: [numericDeckId], chainId: chainId,
    });

    // Map the raw data
    const currentDeckInfo = mapContractDataToDeck(deckDataRaw, numericDeckId, tokenDetails);

    if (!currentDeckInfo) {
      console.log(`API Route: No deck info found for deck ID: ${numericDeckId}`);
      return NextResponse.json({
          deckId: numericDeckId,
          analysis: { summary: "Could not retrieve current deck information.", insights: [], riskAssessment: "N/A", recommendation: "N/A" }
      });
    }

    // --- Step 2: Prepare CURRENT Data for Prompt ---
    // Format BigInts for prompt readability using utils
    const formattedTotalInvestment = formatBalance(currentDeckInfo.totalInvestment, currentDeckInfo.tokenDecimals, 2);
    const formattedProfitGenerated = formatBalance(currentDeckInfo.profitGenerated, currentDeckInfo.tokenDecimals, 2);
    const formattedMinInvestment = formatBalance(currentDeckInfo.minInvestment, currentDeckInfo.tokenDecimals, 2);

    const currentDataForPrompt = {
        totalInvestment: `${formattedTotalInvestment} ${currentDeckInfo.tokenSymbol}`,
        profitGenerated: `${formattedProfitGenerated} ${currentDeckInfo.tokenSymbol}`,
        investorsCount: currentDeckInfo.investorsCount,
        minInvestment: `${formattedMinInvestment} ${currentDeckInfo.tokenSymbol}`,
        isActive: currentDeckInfo.status === 'active',
        description: currentDeckInfo.description || 'Not provided',
    };

    // --- Step 3: Create Simplified Prompt ---
    const prompt = `
      Analyze the following *current snapshot* data for investment Deck ID ${numericDeckId}:
      Deck Name: ${currentDeckInfo.name || 'Unnamed'}
      Description: ${currentDataForPrompt.description}
      Is Active: ${currentDataForPrompt.isActive}
      Total Investment (TVL): ${currentDataForPrompt.totalInvestment}
      Total Profit Generated: ${currentDataForPrompt.profitGenerated}
      Number of Investors: ${currentDataForPrompt.investorsCount}
      Minimum Investment: ${currentDataForPrompt.minInvestment}

      Based *only* on this current snapshot data (NOT historical trends), generate a JSON object containing the following keys:
      - "summary": (String) A brief interpretation of the deck's current state (TVL, profit relative to TVL, investor count). Max 2-3 sentences.
      - "insights": (Array of Strings) 2-3 potential insights based *only* on the current data (e.g., "High TVL suggests popularity", "Profitability ratio seems X", "Low investor count might mean new/niche"). Acknowledge lack of historical context.
      - "riskAssessment": (String) A generic risk assessment based *only* on the deck description and potentially minInvestment (e.g., "Appears Growth-Focused based on description", "Strategy suggests Lower Risk", "Cannot determine risk from snapshot"). Explicitly state this is NOT based on performance history.
      - "recommendation": (String) A very cautious, generic statement based *only* on the snapshot (e.g., "Potential option if description aligns with goals", "Requires further research due to lack of historical data", "Seems inactive"). State that historical performance check is crucial.

      Ensure the ENTIRE output is a single, valid JSON object. Do not include markdown formatting like \`\`\`json. Do not analyze trends or volatility. Focus on interpreting the current numbers and description.
    `;

    // --- Step 4: Call Gemini API ---
    const model = 'gemini-1.5-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    console.log(`API Route: Calling Gemini API for deck ID: ${numericDeckId} (snapshot analysis).`);
    const geminiRes = await axios.post( url, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 800, temperature: 0.4 } }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 } );

    // --- Step 5: Extract and Parse Response ---
    const rawText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) { throw new Error("No analysis text provided by AI model."); }

    let analysisResult;
    try {
        analysisResult = JSON.parse(rawText);
        console.log(`API Route: Parsed Gemini JSON for deck ID: ${numericDeckId}`);
        if (!analysisResult.summary || !analysisResult.insights) { // Basic validation
             console.warn("API Route: Parsed JSON missing keys for deck:", numericDeckId);
             analysisResult = { summary: analysisResult.summary || "Analysis generated, structure incomplete.", insights: analysisResult.insights || [], riskAssessment: analysisResult.riskAssessment || "N/A", recommendation: analysisResult.recommendation || "N/A", };
        }
        delete analysisResult.graphData; // Remove fields not requested
        delete analysisResult.trends;

    } catch (parseError) {
        console.error(`API Route: Failed parse Gemini JSON for deck ${numericDeckId}:`, parseError, "Raw:", rawText);
        analysisResult = { summary: "Failed to parse AI analysis.", rawText: rawText, insights: [], riskAssessment: "Error", recommendation: "Error" };
    }

    // --- Step 6: Send Response ---
    return NextResponse.json({ deckId: numericDeckId, analysis: analysisResult });

  } catch (err) {
     console.error(`API Route: Error for deck ${numericDeckId}:`, err.response?.data || err.message || err);
     const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to generate analysis';
     const statusCode = err.response?.status || 500;
     return NextResponse.json({
         deckId: numericDeckId, error: errorMessage,
         analysis: { summary: `Error: ${errorMessage}`, insights: [], riskAssessment: "Error", recommendation: "Error" }
     }, { status: statusCode });
  }
}