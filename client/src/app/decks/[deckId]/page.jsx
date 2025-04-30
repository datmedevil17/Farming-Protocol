"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { mapContractDataToDeck, fetchPlatformTokenDetails, shortenAddress, formatBalance } from '@/lib/utils';
import InvestmentForm from '@/components/InvestmentForm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const InfoRow = ({ label, value, valueClassName = '', children }) => ( <div><span className="font-medium text-gray-500">{label}:</span>{' '}{children || <span className={`font-semibold text-gray-100 ${valueClassName}`}>{value || 'N/A'}</span>}</div> );
const DeckDetailInfo = ({ deck, chain }) => { const explorerUrl = chain?.blockExplorers?.default?.url; const creatorLink = explorerUrl && deck.creator ? `${explorerUrl}/address/${deck.creator}` : '#'; const tokenLink = explorerUrl && deck.token ? `${explorerUrl}/address/${deck.token}` : '#'; return ( <Card className="!bg-gray-800/80"><h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-100">{deck.name || `Deck ${deck.id}`}</h1><p className="text-sm sm:text-base text-gray-400 mb-5">{deck.description || "No description available."}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm"><InfoRow label="Status" value={deck.status} valueClassName={`capitalize font-semibold ${deck.status === 'active' ? 'text-green-400' : 'text-red-400'}`} /><InfoRow label="Risk Level" value={deck.riskLevel} valueClassName={deck.riskLevel === 'Low' ? 'text-green-400' : deck.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'}/><InfoRow label="Investment Asset"><Link href={tokenLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-400 hover:text-purple-300 hover:underline underline-offset-2 decoration-dotted" title={deck.token}>{deck.tokenSymbol || 'N/A'}</Link></InfoRow>{deck.minInvestment !== undefined && deck.minInvestment > 0n && <InfoRow label="Min. Investment" value={`${formatBalance(deck.minInvestment, deck.tokenDecimals, 2)} ${deck.tokenSymbol}`} />}<InfoRow label="Creator"><Link href={creatorLink} target="_blank" rel="noopener noreferrer" className="font-mono text-purple-400 hover:text-purple-300 hover:underline underline-offset-2 decoration-dotted" title={deck.creator}>{shortenAddress(deck.creator)}</Link></InfoRow>{deck.strategy && <InfoRow label="Strategy" value={deck.strategy} />}</div></Card> ); };
const DeckStats = ({ deck }) => { const isLoadingStats = false; const formattedTVL = formatBalance(deck.totalInvestment, deck.tokenDecimals, 0); const formattedProfit = formatBalance(deck.profitGenerated, deck.tokenDecimals, 2); return ( <Card className="!bg-gray-800/80"><h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">Statistics</h2>{isLoadingStats ? ( <p className="text-sm text-gray-400">Loading stats...</p> ) : ( <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm"><InfoRow label="Total Invested (TVL)" value={`${formattedTVL} ${deck.tokenSymbol}`} /><InfoRow label="Total Profit Generated" value={`${formattedProfit} ${deck.tokenSymbol}`} /><InfoRow label="Est. APY" value={deck.currentAPY !== undefined ? `${deck.currentAPY.toFixed(1)}%` : '-'} /><InfoRow label="Investor Count" value={deck.investorsCount?.toString()} /><div className="sm:col-span-2 mt-3 text-center text-sm text-gray-500">More detailed metrics coming soon.</div></div> )}</Card> ); };

export default function DeckDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deckIdParam = params.deckId;
  const deckIdNumeric = deckIdParam ? Number(deckIdParam) : undefined;
  const { chain } = useAccount();
  const [tokenDetails, setTokenDetails] = useState(null);
  useEffect(() => { if (chain?.id) { fetchPlatformTokenDetails(chain.id).then(setTokenDetails); } }, [chain?.id]);

  const { data: deck, isLoading: isLoadingDeck, error, refetch } = useReadContract({
    address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [deckIdNumeric], chainId: chain?.id,
    query: { enabled: deckIdNumeric !== undefined && !isNaN(deckIdNumeric) && !!chain?.id && !!tokenDetails && !!investmentDeckManagerAddress, select: (data) => mapContractDataToDeck(data, deckIdNumeric, tokenDetails), } });
  const isLoading = isLoadingDeck || !tokenDetails;

  if (!investmentDeckManagerAddress) { return <Card className='text-center'><p className="text-red-400">Platform contract address not set.</p></Card>; }
  if (isLoading) { return <div className="text-center py-20 text-gray-400 animate-pulse">Loading deck details...</div>; }
  if (error || !deck) { console.error("Deck detail fetch error:", error); const message = !deck ? `Could not find details for deck ID "${deckIdParam}".` : `Error loading deck: ${error.shortMessage || error.message}`; return ( <div className="text-center py-10 max-w-lg mx-auto"><svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className='text-red-400 mb-6'>{message}</p><Button onClick={() => router.back()} variant="secondary">Go Back</Button></div> ); }

  return (
    <div className="space-y-8 sm:space-y-10">
       <div><Button onClick={() => router.back()} variant="ghost" small> ← Back to Decks </Button></div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8"><DeckDetailInfo deck={deck} chain={chain} /><DeckStats deck={deck} /></div>
          <div className="lg:col-span-1 lg:sticky lg:top-24"><InvestmentForm deck={deck} /></div>
       </div>
    </div> );
}