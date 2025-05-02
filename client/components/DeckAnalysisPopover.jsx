// components/DeckAnalysisPopover.jsx
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Button from './ui/Button';
import { Info, Loader2, AlertTriangle, X } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DeckAnalysisPopover({ deckId }) {
    const [analysisData, setAnalysisData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const analysisTriggerRef = useRef(null);
    const analysisPopoverRef = useRef(null);

    const fetchAnalysis = async () => {
        if (!deckId && deckId !== 0) return;
        if (isLoading || (analysisData && !error)) return;
        setIsLoading(true); setError(null);
        try {
            // ---> CORRECTED FETCH URL <---
            const response = await fetch(`/decks/${deckId}/analysis`); // Remove /api prefix
            // ---> END CORRECTION <---

            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || `HTTP error! status: ${response.status}`); }
            setAnalysisData(data.analysis);
        } catch (err) {
            console.error("Failed fetch deck analysis:", err);
            setError(err.message || "Failed load analysis.");
            setAnalysisData({ summary: `Error: ${err.message}`, insights: [], riskAssessment: "Error", recommendation: "Error"});
        } finally { setIsLoading(false); }
    };

    // Effect to close popover if clicked outside
    useEffect(() => { function handleClickOutside(event) { if ( isOpen && analysisPopoverRef.current && !analysisPopoverRef.current.contains(event.target) && analysisTriggerRef.current && !analysisTriggerRef.current.contains(event.target) ) { setIsOpen(false); } } document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); }; }, [isOpen]);

    // Chart Config (keep as before)
    const chartData = useMemo(() => ({ /* ... */ }), [analysisData]);
    const chartOptions = { /* ... */ };

    return (
         <div className="relative inline-block">
            <button ref={analysisTriggerRef} onClick={(e) => { e.stopPropagation(); if (!analysisData && !isLoading && !error) fetchAnalysis(); setIsOpen(prev => !prev); }} onMouseEnter={() => { if (!analysisData && !isLoading && !error && !isOpen) { fetchAnalysis(); } }} className="p-1 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/40 transition-colors" title="View AI Analysis"> <Info className="w-4 h-4" /> </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div ref={analysisPopoverRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="absolute top-full right-0 mt-1 w-[300px] sm:w-[350px] z-30 bg-gray-950 border border-indigo-700/50 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} >
                        <div className="p-3 space-y-3 relative">
                             <button onClick={() => setIsOpen(false)} className="absolute top-1.5 right-1.5 p-1 text-gray-500 hover:text-gray-200 rounded-full hover:bg-gray-700" title="Close"> <X className="w-3 h-3"/> </button>
                            <h4 className="font-semibold text-sm text-indigo-300 pr-6">AI Deck Analysis (Snapshot)</h4>
                            {/* Loading State */}
                            {isLoading && ( <div className="flex items-center justify-center py-8 text-xs text-gray-400"><Loader2 className="w-4 h-4 animate-spin text-indigo-400 mr-2" />Generating...</div> )}
                            {/* Error State */}
                            {error && !isLoading && ( <div className="text-center py-4 text-red-400"><AlertTriangle className="w-6 h-6 mx-auto mb-1"/><p className='font-semibold text-xs'>Error</p><p className='text-[10px] mt-1'>{error}</p></div> )}
                            {/* Success State */}
                            {analysisData && !isLoading && !error && (
                                <div className="space-y-2 text-xs text-gray-300">
                                    <div><p className="font-medium text-gray-100 text-[11px] mb-0.5">Summary:</p><p className='text-gray-400 leading-relaxed'>{analysisData.summary || "N/A"}</p></div>
                                    {/* --- Removed Chart Display --- */}
                                    {analysisData.insights && analysisData.insights.length > 0 && (<div><p className="font-medium text-gray-100 text-[11px] mb-0.5">Insights:</p><ul className="list-disc list-inside space-y-0.5 pl-1 text-gray-400">{analysisData.insights.map((insight, i) => <li key={i}>{insight}</li>)}</ul></div>)}
                                    <div><p className="font-medium text-gray-100 text-[11px] mb-0.5">Risk (Snapshot):</p><p className='text-gray-400'>{analysisData.riskAssessment || "N/A"}</p></div>
                                    <div><p className="font-medium text-gray-100 text-[11px] mb-0.5">Recommendation (Snapshot):</p><p className='text-gray-400'>{analysisData.recommendation || "N/A"}</p></div>
                                    {analysisData.rawText && (<div className='mt-3 pt-2 border-t border-gray-700'><p className="font-medium text-yellow-400 text-[10px] mb-0.5">Raw Output:</p><pre className='text-[9px] whitespace-pre-wrap bg-gray-800 p-1 rounded font-mono max-h-20 overflow-y-auto'>{analysisData.rawText}</pre></div>)}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}