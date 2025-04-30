"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useReadContracts } from 'wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { formatBalance, mapContractDataToDeck, fetchPlatformTokenDetails, shortenAddress } from '@/lib/utils';
import Link from 'next/link';
import DeckCard from '@/components/DeckCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConnectWallet from '@/components/ConnectWallet';

const SummaryCard = ({ title, value, isLoading, symbol, children }) => ( <Card className='!bg-gray-800/80 flex flex-col'><h2 className="text-sm sm:text-base font-semibold text-gray-400 mb-1">{title}</h2><div className="flex-grow">{children ? children : ( <p className="text-xl sm:text-2xl font-bold text-gray-100">{isLoading ? <span className="opacity-50">...</span> : value}{symbol && !isLoading && <span className="text-base sm:text-lg ml-1 text-gray-500">{symbol}</span>}</p> )}</div></Card> );

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [tokenDetails, setTokenDetails] = useState(null);
  useEffect(() => { if (chain?.id) { fetchPlatformTokenDetails(chain.id).then(setTokenDetails); } }, [chain?.id]);

  const { data: tokenBalanceData, isLoading: isLoadingTokenBalance } = useBalance({ address: address, token: tokenDetails?.address, chainId: chain?.id, query: { enabled: isConnected && !!address && !!tokenDetails?.address } });
  const formattedTokenBalance = formatBalance(tokenBalanceData?.value, tokenDetails?.decimals, 2);
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';

  const hasGetUserTotalValue = investmentDeckManagerABI.some(item => item.name === 'getUserTotalValue');
  const { data: totalValueData, isLoading: isLoadingInvestmentValue } = useReadContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getUserTotalValue', args: [address], chainId: chain?.id, query: { enabled: isConnected && !!address && !!chain && !!investmentDeckManagerAddress && hasGetUserTotalValue } });
  const formattedTotalValue = formatBalance(totalValueData, tokenDetails?.decimals ?? 18, 2);

  const deckPreviewContracts = useMemo(() => { if (!chain?.id || !tokenDetails || !investmentDeckManagerAddress) return []; const previewIds = [0, 1, 2]; return previewIds.map(id => ({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'getDeckInfo', args: [id], chainId: chain.id, })); }, [chain?.id, tokenDetails]);
  const { data: previewDecksRawData, isLoading: isLoadingDecks } = useReadContracts({ contracts: deckPreviewContracts, query: { enabled: deckPreviewContracts.length > 0 && !!tokenDetails, select: (results) => results.map((res, index) => res.status === 'success' ? mapContractDataToDeck(res.result, index, tokenDetails) : null).filter(Boolean), } });
  const previewDecks = previewDecksRawData || [];
  const isOverallLoading = !tokenDetails || isLoadingTokenBalance || (hasGetUserTotalValue && isLoadingInvestmentValue) || isLoadingDecks;

  if (!isConnected) { return ( <Card className="text-center mt-10 max-w-md mx-auto"><h2 className="text-xl font-semibold mb-3">Welcome to RootInvest!</h2><p className="text-gray-400 mb-6 text-sm">Connect your wallet to manage your investments on the Sepolia testnet.</p><ConnectWallet /></Card> ); }
  if (!investmentDeckManagerAddress) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Platform contract address not configured in `lib/contracts.js`.</p></Card>; }

  return (
    <div className="space-y-8 sm:space-y-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100"> Welcome Back, <span className='text-purple-400'>{shortenAddress(address, 5, 4)}</span>! </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SummaryCard title="Token Balance" isLoading={isLoadingTokenBalance || !tokenDetails} value={formattedTokenBalance} symbol={tokenSymbol} />
        {hasGetUserTotalValue ? ( <SummaryCard title="Total Invested Value (Est.)" isLoading={isLoadingInvestmentValue || !tokenDetails} value={formattedTotalValue} symbol={tokenSymbol} /> ) : ( <SummaryCard title="Total Invested" isLoading={isOverallLoading} value="N/A" /> )}
        <SummaryCard title="Recent Performance"><p className="text-xl sm:text-2xl font-bold text-gray-500">- %</p><p className="text-xs text-gray-400 mt-1">Performance data unavailable.</p></SummaryCard>
      </div>
      <div>
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl sm:text-2xl font-semibold text-gray-200">Featured Decks</h2><Link href="/decks" className="text-purple-400 hover:text-purple-300 font-medium text-sm sm:text-base hover:underline underline-offset-2 decoration-dotted"> View All → </Link></div>
        {isLoadingDecks && <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><DeckCard isLoading={true}/><DeckCard isLoading={true}/><DeckCard isLoading={true}/></div>}
        {!isLoadingDecks && previewDecks.length > 0 && ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{previewDecks.map((deck) => ( deck && <DeckCard key={deck.id} deck={deck} /> ))}</div> )}
        {!isLoadingDecks && previewDecks.length === 0 && ( <Card><p className="text-gray-500 text-center py-6">No featured decks available right now, or could not fetch initial decks.</p></Card> )}
      </div>
    </div>
  );
}