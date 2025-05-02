// app/portfolio/page.jsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { mapContractDataToDeck, mapContractDataToInvestment, fetchPlatformTokenDetails, formatBalance } from '@/lib/utils'; // mapContractDataToDeck needed for mapping
import PortfolioRow from '@/components/PortfolioRow';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Summary Card Component
const SummaryCard = ({ title, value, isLoading, symbol }) => ( <Card className='!bg-gray-800/80'><h3 className="text-sm sm:text-base font-semibold text-gray-400 mb-1">{title}</h3><p className="text-lg sm:text-xl font-bold text-gray-100">{isLoading ? '...' : value}{symbol && !isLoading && <span className="text-sm sm:text-base ml-1 text-gray-500">{symbol}</span>}</p></Card> );

export default function PortfolioPage() {
   const { address, isConnected, chain } = useAccount();
   const [tokenDetails, setTokenDetails] = useState(null);
   const [allDeckInfoMap, setAllDeckInfoMap] = useState({});
   const [userInvestmentContracts, setUserInvestmentContracts] = useState([]);
   const [isRefetching, setIsRefetching] = useState(false);
   useEffect(() => { if (chain?.id) { fetchPlatformTokenDetails(chain.id).then(setTokenDetails); } }, [chain?.id]);

   // Fetch Deck Count
   const { data: deckCountData, isLoading: isLoadingCount } = useReadContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckCount', chainId: chain?.id, query: { enabled: !!chain?.id && !!investmentDeckManagerAddress } });

   // Fetch All Deck Infos
   const deckInfoContracts = useMemo(() => { if (deckCountData === undefined || !tokenDetails || !chain?.id || !investmentDeckManagerAddress) return []; const count = Number(deckCountData); return Array.from({ length: count }, (_, i) => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [i], chainId: chain.id, })); }, [deckCountData, chain?.id, tokenDetails]);
   const { data: allDecksRawData, isLoading: isLoadingDecks, refetch: refetchDecks } = useReadContracts({ contracts: deckInfoContracts, query: { enabled: deckInfoContracts.length > 0 && !!tokenDetails, select: (results) => results.map((res, index) => res.status === 'success' ? mapContractDataToDeck(res.result, index, tokenDetails) : null).filter(Boolean) } });
   useEffect(() => { if (allDecksRawData) { const map = {}; allDecksRawData.forEach(deck => { if(deck) map[deck.id] = deck; }); setAllDeckInfoMap(map); } }, [allDecksRawData]);

   // Prepare Investment Info Contracts
   useEffect(() => { const deckIds = Object.keys(allDeckInfoMap); if (deckIds.length > 0 && address && chain?.id && investmentDeckManagerAddress) { const contracts = deckIds.map(deckId => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getInvestmentInfo', args: [Number(deckId), address], chainId: chain.id })); setUserInvestmentContracts(contracts); } else { setUserInvestmentContracts([]); } }, [allDeckInfoMap, address, chain?.id]);

   // Fetch User Investment Infos & Map with Deck Data
   // ******************************************************************
   // ** WARNING: THIS IS INEFFICIENT!                               **
   // ******************************************************************
   const { data: userInvestmentsRawData, isLoading: isLoadingInvestments, error, refetch: refetchInvestments } = useReadContracts({
       contracts: userInvestmentContracts,
       query: {
           enabled: userInvestmentContracts.length > 0 && Object.keys(allDeckInfoMap).length > 0,
           select: (results) => {
               return results
                   .map((res, index) => {
                        const deckId = userInvestmentContracts[index]?.args[0];
                        if (res.status === 'success' && res.result && BigInt(res.result[0] || 0) > 0n && deckId !== undefined) {
                             const correspondingDeckInfo = allDeckInfoMap[deckId];
                             if (correspondingDeckInfo) {
                                 const investmentBase = mapContractDataToInvestment(res.result, correspondingDeckInfo);
                                 if (investmentBase) {
                                     // Add necessary deck fields for profit calculation in PortfolioRow
                                     return {
                                         ...investmentBase,
                                         deckTotalInvestment: correspondingDeckInfo.totalInvestment,
                                         deckProfitGenerated: correspondingDeckInfo.profitGenerated,
                                     };
                                 }
                             } else { console.warn(`No deck info for ID ${deckId} in map`); }
                        }
                        return null;
                   })
                   .filter(Boolean);
           }
       }
   });
   const userInvestments = userInvestmentsRawData || [];

   // Calculate Summary
   const { totalInvested, investmentCount } = useMemo(() => { if (!userInvestments || userInvestments.length === 0) { return { totalInvested: 0n, investmentCount: 0 }; } const value = userInvestments.reduce((sum, inv) => sum + (inv.amountInvested || 0n), 0n); return { totalInvested: value, investmentCount: userInvestments.length }; }, [userInvestments]);
   const summaryDecimals = tokenDetails?.decimals ?? 18;
   const summarySymbol = tokenDetails?.symbol || 'TOKEN';

   const handleRefetch = async () => { setIsRefetching(true); console.log("Refetching portfolio..."); try { await refetchDecks(); await refetchInvestments(); } catch (err) { console.error("Refetch failed:", err); } finally { setIsRefetching(false); console.log("Refetch complete."); } };
   const isLoading = isLoadingCount || isLoadingDecks || isLoadingInvestments || !tokenDetails || isRefetching;

   if (!isConnected || !address) { return <Card className="text-center mt-10"><p className="text-gray-400">Please connect your wallet to view your portfolio.</p></Card>; }
   if (!investmentDeckManagerAddress) { return <Card className='text-center'><p className="text-red-400">Platform contract address not set.</p></Card>; }

  return (
    <div className="space-y-8">
      <div className='flex justify-between items-center'><h1 className="text-2xl sm:text-3xl font-bold text-purple-300">My Portfolio</h1><Button onClick={handleRefetch} disabled={isLoading} variant='secondary' small loading={isRefetching}> {isRefetching ? 'Refreshing...' : 'Refresh'} </Button></div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <SummaryCard title="Total Invested" isLoading={isLoading} value={formatBalance(totalInvested, summaryDecimals, 2)} symbol={summarySymbol} />
          <SummaryCard title="Active Investments" isLoading={isLoading} value={investmentCount}/>
          <SummaryCard title="Overall P/L (Est.)" isLoading={isLoading} value="N/A" />
       </div>
      <Card padding='p-0' className='!bg-gray-850 overflow-hidden'>
         <h2 className="text-base sm:text-lg font-semibold p-4 border-b border-gray-700/50">Your Investments</h2>
         {/* --- Conditional Rendering Block (Corrected) --- */}
         {isLoading && <p className="p-10 text-center text-gray-400 text-sm animate-pulse">Loading investments...</p>}
         {!isLoading && error && <p className="p-6 text-center text-red-400 text-sm">Error loading investments: {error.shortMessage || error.message}</p>}
         {!isLoading && !error && (
            userInvestments.length > 0 ? (
                <div>{userInvestments.map((investment, index) => (
                    investment && <PortfolioRow key={`${investment.deckId}-${index}`} investment={investment} onActionSuccess={handleRefetch} />
                 ))}</div>
            ) : (
                <p className="p-10 text-center text-gray-500">You have no active investments yet.</p>
            )
         )}
         {/* --- End Conditional Rendering Block --- */}
      </Card>
    </div> );
}