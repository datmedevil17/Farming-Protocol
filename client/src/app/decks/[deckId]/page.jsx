// app/decks/[deckId]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import axios from 'axios'; // <<< Import Axios for API call
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { mapContractDataToDeck, fetchPlatformTokenDetails, shortenAddress, formatBalance } from '@/lib/utils';
import InvestmentForm from '@/components/InvestmentForm';
import AddProfitForm from '@/components/AddProfitForm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { Loader2, AlertTriangle, X, BrainCircuit, Info } from 'lucide-react'; // Added BrainCircuit, kept Info just in case
import { motion, AnimatePresence } from 'framer-motion';

// --- Components (InfoRow, DeckDetailInfo, DeckStats - Keep as before) ---
const InfoRow = ({ label, value, valueClassName = '', children }) => ( <div><span className="font-medium text-gray-500">{label}:</span>{' '}{children || <span className={`font-semibold text-gray-100 ${valueClassName}`}>{value || 'N/A'}</span>}</div> );
const DeckDetailInfo = ({ deck, chain }) => { const explorerUrl = chain?.blockExplorers?.default?.url; const creatorLink = explorerUrl && deck.creator ? `${explorerUrl}/address/${deck.creator}` : '#'; const tokenLink = explorerUrl && deck.token ? `${explorerUrl}/address/${deck.token}` : '#'; return ( <Card className="!bg-gray-800/80"><h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-100">{deck.name || `Deck ${deck.id}`}</h1><p className="text-sm sm:text-base text-gray-400 mb-5">{deck.description || "No description."}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm"><InfoRow label="Status" value={deck.status} valueClassName={`capitalize font-semibold ${deck.status === 'active' ? 'text-green-400' : 'text-red-400'}`} /><InfoRow label="Risk Level" value={deck.riskLevel} valueClassName={deck.riskLevel === 'Low' ? 'text-green-400' : deck.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'}/><InfoRow label="Investment Asset"><Link href={tokenLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-400 hover:text-purple-300 hover:underline underline-offset-2 decoration-dotted" title={deck.token}>{deck.tokenSymbol || 'N/A'}</Link></InfoRow>{deck.minInvestment !== undefined && deck.minInvestment > 0n && <InfoRow label="Min. Investment" value={`${formatBalance(deck.minInvestment, deck.tokenDecimals, 2)} ${deck.tokenSymbol}`} />}<InfoRow label="Creator"><Link href={creatorLink} target="_blank" rel="noopener noreferrer" className="font-mono text-purple-400 hover:text-purple-300 hover:underline underline-offset-2 decoration-dotted" title={deck.creator}>{shortenAddress(deck.creator)}</Link></InfoRow>{deck.strategy && <InfoRow label="Strategy" value={deck.strategy} />}</div></Card> ); };
const DeckStats = ({ deck }) => { if (!deck) { return <Card className="!bg-gray-800/80"><p className="text-sm text-gray-500">Statistics unavailable.</p></Card>; } const formattedTVL = formatBalance(deck.totalInvestment, deck.tokenDecimals, 0); const formattedProfit = formatBalance(deck.profitGenerated, deck.tokenDecimals, 2); return ( <Card className="!bg-gray-800/80"><h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">Statistics</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm"><InfoRow label="Total Invested (TVL)" value={`${formattedTVL} ${deck.tokenSymbol}`} /><InfoRow label="Total Profit Generated" value={`${formattedProfit} ${deck.tokenSymbol}`} /><InfoRow label="Est. APY" value={deck.currentAPY !== undefined ? `${deck.currentAPY.toFixed(1)}%` : '-'} /><InfoRow label="Investor Count" value={deck.investorsCount?.toString()} /></div></Card> ); };


// --- Deck Detail Page Component ---
export default function DeckDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deckIdParam = params.deckId;
  const deckIdNumeric = deckIdParam ? Number(deckIdParam) : undefined;
  const { address, isConnected, chain } = useAccount();
  const [tokenDetails, setTokenDetails] = useState(null);

  // State for AI Analysis Modal
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Fetch Platform Token Details
  useEffect(() => { if (chain?.id) { fetchPlatformTokenDetails(chain.id).then(setTokenDetails); } }, [chain?.id]);

  // Fetch deck details (this contains the data we need for the AI prompt)
  const { data: deck, isLoading: isLoadingDeck, error: deckError, refetch } = useReadContract({
    address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [deckIdNumeric], chainId: chain?.id,
    query: { enabled: deckIdNumeric !== undefined && !isNaN(deckIdNumeric) && !!chain?.id && !!tokenDetails && !!investmentDeckManagerAddress, select: (data) => mapContractDataToDeck(data, deckIdNumeric, tokenDetails), } });
  const isLoadingPage = isLoadingDeck || !tokenDetails;

  // Check if user is creator
  const isCreator = isConnected && deck && address?.toLowerCase() === deck.creator?.toLowerCase();

  // --- Function to Fetch Analysis DIRECTLY from Frontend ---
  const handleFetchAnalysis = async () => {
      if (!deck || isLoadingAnalysis) return; // Need deck data

      // --- Check for API Key ---
      // IMPORTANT: This exposes your key in the browser bundle. Use API routes for production.
       const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
       if (!apiKey) {
           console.error("Gemini API Key (NEXT_PUBLIC_GEMINI_API_KEY) is not set!");
           setAnalysisError("AI analysis configuration error.");
           setAnalysisData({ summary: "Error: AI Key missing.", insights: [], riskAssessment: "Error", recommendation: "Error"});
           setIsAnalysisModalOpen(true); // Open modal to show error
           return;
       }

      setIsLoadingAnalysis(true);
      setAnalysisError(null);
      setAnalysisData(null);
      setIsAnalysisModalOpen(true); // Open modal

      try {
          // --- Prepare Data for Prompt (using data available in component state) ---
          const tokenDecimals = deck.tokenDecimals ?? 18;
          const tokenSymbol = deck.tokenSymbol || 'TOKEN';
          const formattedTotalInvestment = formatBalance(deck.totalInvestment, tokenDecimals, 2);
          const formattedProfitGenerated = formatBalance(deck.profitGenerated, tokenDecimals, 2);
          const formattedMinInvestment = formatBalance(deck.minInvestment, tokenDecimals, 2);

          const currentDataForPrompt = {
              name: deck.name || 'Unnamed Deck',
              description: deck.description || 'Not provided',
              isActive: deck.status === 'active',
              totalInvestment: `${formattedTotalInvestment} ${tokenSymbol}`,
              profitGenerated: `${formattedProfitGenerated} ${tokenSymbol}`,
              investorsCount: deck.investorsCount,
              minInvestment: `${formattedMinInvestment} ${tokenSymbol}`,
          };

          // --- Create Prompt ---
          const prompt = `
            Analyze the following current snapshot data for investment Deck ID ${deck.id}:
            Deck Name: ${currentDataForPrompt.name}
            Description: ${currentDataForPrompt.description}
            Status: ${currentDataForPrompt.isActive ? 'Active' : 'Inactive'}
            Total Investment (TVL): ${currentDataForPrompt.totalInvestment}
            Total Profit Added by Creator/Owner: ${currentDataForPrompt.profitGenerated}
            Number of Investors: ${currentDataForPrompt.investorsCount}
            Minimum Investment: ${currentDataForPrompt.minInvestment}

            Based *only* on this current snapshot data (no historical trends):
            Generate a JSON object containing ONLY the following keys with string values:
            - "summary": A brief interpretation (2-3 sentences) of the deck's current status. Comment on its scale (TVL) and apparent profitability (profit vs TVL).
            - "insights": An array of 2-3 strings, each a potential insight based *only* on the current data and description (e.g., "High TVL suggests popularity", "Profitability ratio seems X"). State that these are based on snapshot data only. Limit each insight string to 1 sentence.
            - "riskAssessment": A generic risk assessment (1-2 sentences) based *only* on the deck description/name (e.g., "Description suggests a focus on [topic], potentially implying [Low/Medium/High] risk"). State this is not based on historical performance.
            - "recommendation": A very cautious statement (1-2 sentences) based *only* on the snapshot (e.g., "Appears active and meets minimum criteria if the strategy aligns with goals", "Requires further research beyond this snapshot"). Emphasize checking history is crucial.

            Ensure the ENTIRE output is a single, valid JSON object without any markdown formatting like \`\`\`json. Respond ONLY with the JSON object.
          `;

          // --- Call Gemini API using Axios ---
          const model = 'gemini-1.5-flash-latest';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

          console.log(`Frontend: Calling Gemini API for deck ID: ${deck.id}`);
          const geminiRes = await axios.post( url, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 800, temperature: 0.4 } }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 } );

          // --- Extract and Parse Response ---
          const rawText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) { throw new Error("No analysis text provided by AI model."); }

          let analysisResult;
            let jsonString = null; // Define outside try for logging
            try {
                // --- Robust Parsing ---
                const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
                if (jsonMatch) { jsonString = jsonMatch[1] || jsonMatch[2]; }
                else { jsonString = rawText.trim(); }
                if (!jsonString) { throw new Error("Could not extract potential JSON from the response."); }

                analysisResult = JSON.parse(jsonString);
                console.log(`Frontend: Successfully parsed Gemini JSON for deck ID: ${deck.id}`);

                // Basic validation
                if (!analysisResult.summary || !analysisResult.insights) { throw new Error("Parsed JSON missing expected keys."); }

                 // Clean up unwanted keys and ensure only expected ones remain
                 const finalResult = {
                     summary: analysisResult.summary || "N/A",
                     insights: analysisResult.insights || [],
                     riskAssessment: analysisResult.riskAssessment || "N/A",
                     recommendation: analysisResult.recommendation || "N/A",
                     // rawText: undefined // Don't include raw text on successful parse
                 };
                 setAnalysisData(finalResult); // <<< Set state with cleaned result

            // --- FIX TYPO IN CATCH ---
            } catch (parseErr) { // <<< Use a different variable name like parseErr
                console.error(`Frontend: Failed parse Gemini JSON for deck ${deck.id}:`, parseErr); // <<< Log the caught error
                console.error("Frontend: Raw Gemini Response Text:", rawText);
                console.error("Frontend: Attempted JSON String:", jsonString);
                setAnalysisError("Failed to parse AI response structure."); // Set specific error message
                setAnalysisData({ // Set fallback data including rawText
                    summary: "Error: Could not parse AI response.", rawText: rawText, insights: [],
                    riskAssessment: "Error", recommendation: "Error"
                });
            }
            // --- END FIX ---

        } catch (err) {
            // Handle outer errors (API call failure, etc.)
            console.error("Failed fetch deck analysis:", err);
            const message = err.response?.data?.error?.message || err.message || "Failed to load analysis.";
            setAnalysisError(message);
            setAnalysisData({ summary: `Error: ${message}`, insights: [], riskAssessment: "Error", recommendation: "Error"});
        } finally {
            setIsLoadingAnalysis(false);
        }
    }; // End of handleFetchAnalysis


  // --- Render Loading/Error States ---
  if (!investmentDeckManagerAddress) { return <Card className='text-center'><p className="text-red-400">Platform contract address not set.</p></Card>; }
  if (isLoadingPage && !deckError) { return <div className="text-center py-20 text-gray-400 animate-pulse">Loading deck details...</div>; }
  if (deckError || (!isLoadingPage && !deck)) { const message = !deck ? `Could not find details for deck ID "${deckIdParam}".` : `Error loading deck: ${deckError?.shortMessage || deckError?.message}`; return ( <div className="text-center py-10 max-w-lg mx-auto"><AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4"/><p className='text-red-400 mb-6'>{message}</p><Button onClick={() => router.back()} variant="secondary">Go Back</Button></div> ); }

  // --- Render Deck Details ---
  return (
    <> {/* Use Fragment for Modal */}
      <div className="space-y-8 sm:space-y-10">
         <div className='flex items-center justify-between relative'>
             <Button onClick={() => router.back()} variant="ghost" small> ← Back to Decks </Button>
             {/* No popover trigger here */}
          </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
               <DeckDetailInfo deck={deck} chain={chain} />
               <DeckStats deck={deck} />

                {/* ---> AI Overview Button <--- */}
                

               {isCreator && tokenDetails && deck && ( <AddProfitForm deck={deck} tokenDetails={tokenDetails} onProfitAdded={refetch} /> )}
            </div>
            <div className="lg:col-span-1 lg:sticky lg:top-24">
               {deck && <InvestmentForm deck={deck} />}
               <div className="text-center pt-2 border-t border-gray-700/50">
                    <Button
                        onClick={handleFetchAnalysis} // Call the local fetch function
                        disabled={isLoadingAnalysis} // Disable while loading analysis
                        loading={isLoadingAnalysis} // Show loading state
                        variant="secondary"
                        className="!bg-indigo-600/80 hover:!bg-indigo-500/80 w-full mt-5"
                    >
                        <BrainCircuit className="w-4 h-4 mr-2" />
                        AI Overview 
                    </Button>
                </div>
            </div>
            
         </div>
      </div>

      {/* --- AI Analysis Modal --- */}
      <AnimatePresence>
         {isAnalysisModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setIsAnalysisModalOpen(false)}>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} className="bg-gray-900 border border-indigo-700/50 rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-gray-700/50 flex-shrink-0"><h3 className="text-lg font-semibold text-indigo-300 flex items-center"> <BrainCircuit className="w-5 h-5 mr-2"/> AI Deck Analysis (Snapshot)</h3><button onClick={() => setIsAnalysisModalOpen(false)} className="p-1 rounded-full text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors" title="Close"><X className="w-5 h-5"/></button></div>
                     <div className="p-5 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        {isLoadingAnalysis && ( <div className="flex items-center justify-center py-16 text-sm text-gray-400"><Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-3" />Generating analysis...</div> )}
                        {analysisError && !isLoadingAnalysis && ( <div className="text-center py-10 text-red-400"><AlertTriangle className="w-10 h-10 mx-auto mb-2"/><p className='font-semibold text-base'>Error Loading Analysis</p><p className='text-sm mt-1'>{analysisError}</p></div> )}
                        {analysisData && !isLoadingAnalysis && !analysisError && (
                            <div className="space-y-3 text-sm text-gray-300">
                                <div><p className="font-medium text-gray-100 mb-1">Summary:</p><p className='text-gray-400 leading-relaxed'>{analysisData.summary || "N/A"}</p></div>
                                {analysisData.insights && analysisData.insights.length > 0 && (<div><p className="font-medium text-gray-100 mb-1">Insights:</p><ul className="list-disc list-inside space-y-1 pl-2 text-gray-400">{analysisData.insights.map((insight, i) => <li key={i}>{insight}</li>)}</ul></div>)}
                                <div><p className="font-medium text-gray-100 mb-1">Risk Assessment (Snapshot):</p><p className='text-gray-400'>{analysisData.riskAssessment || "N/A"}</p></div>
                                <div><p className="font-medium text-gray-100 mb-1">Recommendation (Snapshot):</p><p className='text-gray-400'>{analysisData.recommendation || "N/A"}</p></div>
                                {analysisData.rawText && (<div className='mt-4 pt-3 border-t border-gray-700'><p className="font-medium text-yellow-400 text-xs mb-1">Raw AI Output:</p><pre className='text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded font-mono max-h-24 overflow-y-auto'>{analysisData.rawText}</pre></div>)}
                            </div>
                        )}
                    </div>
                     <div className='p-4 border-t border-gray-700/50 text-right flex-shrink-0'><Button variant='secondary' onClick={() => setIsAnalysisModalOpen(false)}>Close</Button></div>
                </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </>
  );
}

