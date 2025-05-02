// app/dashboard/page.jsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useReadContracts } from 'wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { formatBalance, mapContractDataToDeck, mapContractDataToInvestment, fetchPlatformTokenDetails, shortenAddress } from '@/lib/utils';
import Link from 'next/link';
import DeckCard from '@/components/DeckCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConnectWallet from '@/components/ConnectWallet';

const SummaryCard = ({ title, value, isLoading, symbol, children }) => ( <Card className='!bg-gray-800/80 flex flex-col'><h2 className="text-sm sm:text-base font-semibold text-gray-400 mb-1">{title}</h2><div className="flex-grow">{children ? children : ( <p className="text-xl sm:text-2xl font-bold text-gray-100">{isLoading ? <span className="opacity-50">...</span> : value}{symbol && !isLoading && <span className="text-base sm:text-lg ml-1 text-gray-500">{symbol}</span>}</p> )}</div></Card> );

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [tokenDetails, setTokenDetails] = useState(null);
  // --- State for Dashboard's investment calculation ---
  const [allDeckInfoMap, setAllDeckInfoMap] = useState({});
  const [userInvestmentContracts, setUserInvestmentContracts] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]); // Store calculated investments for dashboard

  // 1. Fetch Platform Token Details
  useEffect(() => { if (chain?.id) { fetchPlatformTokenDetails(chain.id).then(setTokenDetails); } }, [chain?.id]);

  // 2. Platform Token Balance
  const { data: tokenBalanceData, isLoading: isLoadingTokenBalance } = useBalance({ address: address, token: tokenDetails?.address, chainId: chain?.id, query: { enabled: isConnected && !!address && !!tokenDetails?.address } });
  const formattedTokenBalance = formatBalance(tokenBalanceData?.value, tokenDetails?.decimals, 2);
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';

  // --- Replicate Portfolio Fetching Logic for Total Invested Value ---

  // 3. Fetch Deck Count
  const { data: deckCountData, isLoading: isLoadingCount } = useReadContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckCount', chainId: chain?.id, query: { enabled: !!chain?.id && !!investmentDeckManagerAddress } });

  // 4. Fetch All Deck Infos
  const deckInfoContracts = useMemo(() => { if (deckCountData === undefined || !tokenDetails || !chain?.id || !investmentDeckManagerAddress) return []; const count = Number(deckCountData); return Array.from({ length: count }, (_, i) => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [i], chainId: chain.id, })); }, [deckCountData, chain?.id, tokenDetails]);
  const { data: allDecksRawData, isLoading: isLoadingDecks } = useReadContracts({ contracts: deckInfoContracts, query: { enabled: deckInfoContracts.length > 0 && !!tokenDetails, select: (results) => results.map((res, index) => res.status === 'success' ? mapContractDataToDeck(res.result, index, tokenDetails) : null).filter(Boolean) } });
  useEffect(() => { if (allDecksRawData) { const map = {}; allDecksRawData.forEach(deck => { if(deck) map[deck.id] = deck; }); setAllDeckInfoMap(map); } }, [allDecksRawData]);

  // 5. Prepare Investment Info Contracts
   useEffect(() => { const deckIds = Object.keys(allDeckInfoMap); if (deckIds.length > 0 && address && chain?.id && investmentDeckManagerAddress) { const contracts = deckIds.map(deckId => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getInvestmentInfo', args: [Number(deckId), address], chainId: chain.id })); setUserInvestmentContracts(contracts); } else { setUserInvestmentContracts([]); } }, [allDeckInfoMap, address, chain?.id]);

  // 6. Fetch User Investment Infos for Dashboard calculation
   const { data: userInvestmentsRawData, isLoading: isLoadingInvestments } = useReadContracts({
       contracts: userInvestmentContracts,
       query: {
           enabled: userInvestmentContracts.length > 0 && Object.keys(allDeckInfoMap).length > 0 && isConnected, // Enable only when connected
           select: (results) => { // Use simpler mapping just for total calculation
               return results
                   .map((res, index) => {
                        const deckId = userInvestmentContracts[index]?.args[0];
                        if (res.status === 'success' && res.result && BigInt(res.result[0] || 0) > 0n && deckId !== undefined) {
                             const correspondingDeckInfo = allDeckInfoMap[deckId];
                             // Need only amount and decimals for total value
                             return {
                                amountInvested: BigInt(res.result[0] || 0),
                                tokenDecimals: correspondingDeckInfo?.tokenDecimals ?? 18,
                             };
                        }
                        return null;
                   })
                   .filter(Boolean);
           }
       }
   });
   // Update dashboard-specific investment state
   useEffect(() => { if (userInvestmentsRawData) setUserInvestments(userInvestmentsRawData); }, [userInvestmentsRawData]);

  // --- Calculate Total Invested Value ---
  const totalInvestedValue = useMemo(() => {
      if (!userInvestments || userInvestments.length === 0 || !tokenDetails) {
           return 0n;
       }
       // We need to sum investments, assuming they are all in the *platform token*
       return userInvestments.reduce((sum, inv) => sum + (inv.amountInvested || 0n), 0n);
  }, [userInvestments, tokenDetails]); // Recalculate if investments or tokenDetails change

  const formattedTotalValue = formatBalance(totalInvestedValue, tokenDetails?.decimals ?? 18, 2);

  // --- Deck Preview Fetching (remains the same) ---
   const deckPreviewContracts = useMemo(() => { /* ... */ if (!chain?.id || !tokenDetails || !investmentDeckManagerAddress) return []; const previewIds = [0, 1, 2]; return previewIds.map(id => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [id], chainId: chain.id, })); }, [chain?.id, tokenDetails]);
   const { data: previewDecksRawData, isLoading: isLoadingPreviewDecks } = useReadContracts({ contracts: deckPreviewContracts, query: { enabled: deckPreviewContracts.length > 0 && !!tokenDetails, select: (results) => results.map((res, index) => res.status === 'success' ? mapContractDataToDeck(res.result, index, tokenDetails) : null).filter(Boolean), } });
   const previewDecks = previewDecksRawData || [];

   // Combine all loading states for summary cards
   const isOverallLoading = !tokenDetails || isLoadingTokenBalance || isLoadingCount || isLoadingDecks || isLoadingInvestments || isLoadingPreviewDecks;

  // --- Render Logic ---
  if (!isConnected) { return ( <Card className="text-center mt-10 max-w-md mx-auto"><h2 className="text-xl font-semibold mb-3">Welcome to RootInvest!</h2><p className="text-gray-400 mb-6 text-sm">Connect your wallet to manage your investments on the Rootstock network.</p><ConnectWallet /></Card> ); }
  if (!investmentDeckManagerAddress) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Platform contract address not configured.</p></Card>; }

  return (
    <div className="space-y-8 sm:space-y-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100"> Welcome Back, <span className='text-purple-400'>{shortenAddress(address, 5, 4)}</span>! </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SummaryCard title="Token Balance" isLoading={isLoadingTokenBalance || !tokenDetails} value={formattedTokenBalance} symbol={tokenSymbol} />
        {/* Use the calculated total value */}
        <SummaryCard title="Total Invested Value" isLoading={isLoadingInvestments || isLoadingDecks || isLoadingCount || !tokenDetails} value={formattedTotalValue} symbol={tokenSymbol} />
        <SummaryCard title="Recent Performance"><p className="text-xl sm:text-2xl font-bold text-gray-500">- %</p><p className="text-xs text-gray-400 mt-1">Performance data unavailable.</p></SummaryCard>
      </div>
      {/* Deck Preview Section (remains the same) */}
      <div>
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl sm:text-2xl font-semibold text-gray-200">Featured Decks</h2><Link href="/decks" className="text-purple-400 hover:text-purple-300 font-medium text-sm sm:text-base hover:underline underline-offset-2 decoration-dotted"> View All → </Link></div>
        {isLoadingPreviewDecks && <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><DeckCard isLoading={true}/><DeckCard isLoading={true}/><DeckCard isLoading={true}/></div>}
        {!isLoadingPreviewDecks && previewDecks.length > 0 && ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{previewDecks.map((deck) => ( deck && <DeckCard key={deck.id} deck={deck} /> ))}</div> )}
        {!isLoadingPreviewDecks && previewDecks.length === 0 && ( <Card><p className="text-gray-500 text-center py-6">No featured decks available right now.</p></Card> )}
      </div>
    </div>
  );
}