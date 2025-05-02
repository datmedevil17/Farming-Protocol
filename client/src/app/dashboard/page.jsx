// app/dashboard/page.jsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useReadContracts } from 'wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { formatBalance, mapContractDataToDeck, mapContractDataToInvestment, fetchPlatformTokenDetails, shortenAddress } from '@/lib/utils';
import Link from 'next/link'; // Keep Link import
import DeckCard from '@/components/DeckCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button'; // Keep Button import
import ConnectWallet from '@/components/ConnectWallet';

// Summary Card Component
const SummaryCard = ({ title, value, isLoading, symbol, children }) => ( <Card className='!bg-gray-800/80 flex flex-col'><h2 className="text-sm sm:text-base font-semibold text-gray-400 mb-1">{title}</h2><div className="flex-grow">{children ? children : ( <p className="text-xl sm:text-2xl font-bold text-gray-100">{isLoading ? <span className="opacity-50">...</span> : value}{symbol && !isLoading && <span className="text-base sm:text-lg ml-1 text-gray-500">{symbol}</span>}</p> )}</div></Card> );

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [tokenDetails, setTokenDetails] = useState(null);
  const [allDeckInfoMap, setAllDeckInfoMap] = useState({});
  const [userInvestmentContracts, setUserInvestmentContracts] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);

  // 1. Fetch Platform Token Details
  useEffect(() => { if (chain?.id) { fetchPlatformTokenDetails(chain.id).then(setTokenDetails); } }, [chain?.id]);

  // 2. Platform Token Balance
  const { data: tokenBalanceData, isLoading: isLoadingTokenBalance } = useBalance({ address: address, token: tokenDetails?.address, chainId: chain?.id, query: { enabled: isConnected && !!address && !!tokenDetails?.address } });
  const formattedTokenBalance = formatBalance(tokenBalanceData?.value, tokenDetails?.decimals, 2);
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';

  // 3. Investment Summary Calculation Logic
  const { data: deckCountData, isLoading: isLoadingCount } = useReadContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckCount', chainId: chain?.id, query: { enabled: !!chain?.id && !!investmentDeckManagerAddress } });
  const deckInfoContracts = useMemo(() => { if (deckCountData === undefined || !tokenDetails || !chain?.id || !investmentDeckManagerAddress) return []; const count = Number(deckCountData); return Array.from({ length: count }, (_, i) => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [i], chainId: chain.id, })); }, [deckCountData, chain?.id, tokenDetails]);
  const { data: allDecksRawData, isLoading: isLoadingDecks } = useReadContracts({ contracts: deckInfoContracts, query: { enabled: deckInfoContracts.length > 0 && !!tokenDetails, select: (results) => results.map((res, index) => res.status === 'success' ? mapContractDataToDeck(res.result, index, tokenDetails) : null).filter(Boolean) } });
  useEffect(() => { if (allDecksRawData) { const map = {}; allDecksRawData.forEach(deck => { if(deck) map[deck.id] = deck; }); setAllDeckInfoMap(map); } }, [allDecksRawData]);
  useEffect(() => { const deckIds = Object.keys(allDeckInfoMap); if (deckIds.length > 0 && address && chain?.id && investmentDeckManagerAddress) { const contracts = deckIds.map(deckId => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getInvestmentInfo', args: [Number(deckId), address], chainId: chain.id })); setUserInvestmentContracts(contracts); } else { setUserInvestmentContracts([]); } }, [allDeckInfoMap, address, chain?.id]);
  const { data: userInvestmentsRawData, isLoading: isLoadingInvestments } = useReadContracts({ contracts: userInvestmentContracts, query: { enabled: userInvestmentContracts.length > 0 && Object.keys(allDeckInfoMap).length > 0 && isConnected, select: (results) => results .map((res, index) => { const deckId = userInvestmentContracts[index]?.args[0]; if (res.status === 'success' && res.result && BigInt(res.result[0] || 0) > 0n && deckId !== undefined) { const correspondingDeckInfo = allDeckInfoMap[deckId]; return { amountInvested: BigInt(res.result[0] || 0), tokenDecimals: correspondingDeckInfo?.tokenDecimals ?? 18, }; } return null; }).filter(Boolean) } });
  useEffect(() => { if (userInvestmentsRawData) setUserInvestments(userInvestmentsRawData); }, [userInvestmentsRawData]);
  const totalInvestedValue = useMemo(() => { if (!userInvestments || userInvestments.length === 0 || !tokenDetails) { return 0n; } return userInvestments.reduce((sum, inv) => sum + (inv.amountInvested || 0n), 0n); }, [userInvestments, tokenDetails]);
  const formattedTotalValue = formatBalance(totalInvestedValue, tokenDetails?.decimals ?? 18, 2);

  // 4. Deck Preview Fetching
   const deckPreviewContracts = useMemo(() => { if (!chain?.id || !tokenDetails || !investmentDeckManagerAddress) return []; const previewIds = [0, 1, 2]; return previewIds.map(id => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [id], chainId: chain.id, })); }, [chain?.id, tokenDetails]);
   const { data: previewDecksRawData, isLoading: isLoadingPreviewDecks } = useReadContracts({ contracts: deckPreviewContracts, query: { enabled: deckPreviewContracts.length > 0 && !!tokenDetails, select: (results) => results.map((res, index) => res.status === 'success' ? mapContractDataToDeck(res.result, index, tokenDetails) : null).filter(Boolean), } });
   const previewDecks = previewDecksRawData || [];

  // 5. Fetch Owner Address for Admin Check
  const { data: ownerAddress } = useReadContract({
      address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'owner', chainId: chain?.id,
      query: { enabled: !!chain?.id && !!investmentDeckManagerAddress }
  });
  const isAdmin = isConnected && !!ownerAddress && address?.toLowerCase() === ownerAddress?.toLowerCase();

  // Overall loading state for summary cards
  const isLoadingSummary = !tokenDetails || isLoadingTokenBalance || isLoadingCount || isLoadingDecks || isLoadingInvestments;

  // --- Render Logic ---
  if (!isConnected) { return ( <Card className="text-center mt-10 max-w-md mx-auto"><h2 className="text-xl font-semibold mb-3">Connect Wallet</h2><p className="text-gray-400 mb-6 text-sm">Connect your wallet to access the dashboard.</p><ConnectWallet /></Card> ); }
  if (!investmentDeckManagerAddress) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Platform contract address not configured.</p></Card>; }

  return (
    <div className="space-y-8 sm:space-y-10">
        {/* --- Page Header with Optional Admin Link --- */}
        <div className="flex justify-between items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
                Welcome Back, <span className='text-purple-400'>{shortenAddress(address, 5, 4)}</span>!
            </h1>
            {/* Admin Link - Only visible if isAdmin */}
            {isAdmin && (
                <Link href="/admin">
                    <Button variant="secondary" small className="!bg-indigo-600/80 hover:!bg-indigo-500/80">
                        Admin Panel
                    </Button>
                </Link>
            )}
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SummaryCard title="Token Balance" isLoading={isLoadingTokenBalance || !tokenDetails} value={formattedTokenBalance} symbol={tokenSymbol} />
        <SummaryCard title="Total Invested Value" isLoading={isLoadingSummary} value={formattedTotalValue} symbol={tokenSymbol} />
        <SummaryCard title="Recent Performance"><p className="text-xl sm:text-2xl font-bold text-gray-500">- %</p><p className="text-xs text-gray-400 mt-1">Performance data unavailable.</p></SummaryCard>
      </div>

      {/* Featured Decks Section */}
      <div>
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl sm:text-2xl font-semibold text-gray-200">Featured Decks</h2><Link href="/decks" className="text-purple-400 hover:text-purple-300 font-medium text-sm sm:text-base hover:underline underline-offset-2 decoration-dotted"> View All → </Link></div>
        {isLoadingPreviewDecks && !tokenDetails && <Card><p className="text-gray-500 text-center py-6 animate-pulse">Loading featured decks...</p></Card>}
        {isLoadingPreviewDecks && tokenDetails && <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><DeckCard isLoading={true}/><DeckCard isLoading={true}/><DeckCard isLoading={true}/></div>}
        {!isLoadingPreviewDecks && previewDecks.length > 0 && ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{previewDecks.map((deck) => ( deck && <DeckCard key={deck.id} deck={deck} /> ))}</div> )}
        {!isLoadingPreviewDecks && previewDecks.length === 0 && ( <Card><p className="text-gray-500 text-center py-6">No featured decks available right now.</p></Card> )}
      </div>

      {/* AdminSettings component is REMOVED from here */}

    </div>
  );
}