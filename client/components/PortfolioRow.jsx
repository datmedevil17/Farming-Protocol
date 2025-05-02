// components/PortfolioRow.jsx
"use client";

import { useState, useMemo } from 'react';
import { useAccount, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { formatBalance, shortenAddress } from '@/lib/utils';
import Button from './ui/Button';
import Link from 'next/link';

export default function PortfolioRow({ investment, onActionSuccess }) {
  const { chain } = useAccount();
  const [showDetails, setShowDetails] = useState(false);
  const [txState, setTxState] = useState({ status: 'idle', message: null });

  const {
      deckId, deckName, amountInvested = 0n,
      tokenSymbol = 'TKN', tokenDecimals = 18, hasWithdrawnProfit,
      deckTotalInvestment = 0n,
      deckProfitGenerated = 0n,
  } = investment || {};
  const deckIdNumeric = deckId;

  const userProfitShare = useMemo(() => {
    if (deckTotalInvestment > 0n && amountInvested > 0n && deckProfitGenerated > 0n) {
        try { return (amountInvested * deckProfitGenerated) / deckTotalInvestment; }
        catch (e) { console.error("Error calculating profit share:", e); return 0n; }
    }
    return 0n;
  }, [amountInvested, deckProfitGenerated, deckTotalInvestment]);

  const formattedUserProfitShare = formatBalance(userProfitShare, tokenDecimals, 4);
  const formattedDeckProfitGenerated = formatBalance(deckProfitGenerated, tokenDecimals, 2);

  const { data: withdrawConfig, error: withdrawSimError } = useSimulateContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'withdrawProfit', args: [deckIdNumeric], chainId: chain?.id, query: { enabled: !!chain && deckIdNumeric !== undefined && !hasWithdrawnProfit && !!investmentDeckManagerAddress && userProfitShare > 0n } });
  const { writeContractAsync: withdrawProfitAsync, data: withdrawTxHash, isPending: isWithdrawingWrite } = useWriteContract();
  const { isLoading: isWaitingForWithdrawal } = useWaitForTransactionReceipt({ hash: withdrawTxHash, query: { enabled: !!withdrawTxHash, onSuccess: (data) => { console.log('Profit withdrawal OK:', data.transactionHash); setTxState({ status: 'success', message: 'Profit withdrawn!' }); if (onActionSuccess) onActionSuccess(); setTimeout(() => setTxState({ status: 'idle', message: null }), 4000); }, onError: (err) => { console.error("Withdrawal receipt error:", err); setTxState({ status: 'error', message: `Withdrawal failed: ${err.message}` }); } } });

  const handleWithdrawProfit = async () => { if (!withdrawConfig?.request) { setTxState({ status: 'error', message: `Cannot prepare withdrawal. ${withdrawSimError?.shortMessage || 'No profit share available or already withdrawn.'}` }); return; } setTxState({ status: 'loading', message: 'Check wallet...' }); try { await withdrawProfitAsync(withdrawConfig.request); setTxState({ status: 'loading', message: 'Processing withdrawal...' }); } catch (err) { console.error("Withdraw write error:", err); setTxState({ status: 'error', message: `Withdrawal cancelled or failed: ${err.shortMessage || err.message}` }); } };

  const isLoading = isWithdrawingWrite || isWaitingForWithdrawal;
  const formattedInvested = formatBalance(amountInvested, tokenDecimals, 2);
  const canWithdrawProfit = withdrawConfig?.request && !isLoading && !hasWithdrawnProfit;

  if (!investment) return null;

  return (
    <div className={`border-b border-gray-700/50 transition-colors duration-300 ${showDetails ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'}`}>
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
           <div className="mb-2 sm:mb-0 flex-1 mr-4 min-w-0"><h3 className="font-semibold text-sm sm:text-base text-purple-300 truncate" title={deckName}>{deckName || `Deck ${deckId}`}</h3><p className="text-xs text-gray-400 font-mono" title={`Deck ID: ${deckId}`}>ID: {deckId}</p></div>
           <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm mb-3 sm:mb-0 flex-shrink-0">
               <div className='whitespace-nowrap text-right'><div className="text-gray-400">Invested</div><div className="font-semibold text-base">{formattedInvested} <span className='text-gray-500 text-xs'>{tokenSymbol}</span></div></div>
               <div className='whitespace-nowrap text-right'><div className="text-gray-400">Your Profit Share</div><div className={`font-semibold text-base ${userProfitShare > 0n ? 'text-green-400' : 'text-gray-400'}`}>{formattedUserProfitShare} <span className='text-gray-500 text-xs'>{tokenSymbol}</span></div></div>
           </div>
           <div className="mt-2 sm:mt-0 sm:ml-6 flex-shrink-0 space-x-2"><Button onClick={() => setShowDetails(!showDetails)} variant={'secondary'} small className='!px-3'> {showDetails ? 'Hide Info' : 'Info'} </Button><Button onClick={handleWithdrawProfit} variant='primary' small disabled={!canWithdrawProfit} loading={isLoading} title={hasWithdrawnProfit ? "Profit already withdrawn" : (!canWithdrawProfit ? "No profit share to withdraw or action unavailable" : "Withdraw your profit share")}> Withdraw Profit </Button></div>
       </div>
       {showDetails && ( <div className="p-4 pt-0 space-y-2 text-xs text-gray-400 animate-fade-in"><hr className='border-gray-700/50 mb-3'/><p>Deck Total Profit Generated: <span className='font-medium text-gray-200'>{formattedDeckProfitGenerated} {tokenSymbol}</span></p><p>Your Calculated Share (before fees): <span className='font-medium text-gray-200'>{formattedUserProfitShare} {tokenSymbol}</span></p><p>Time Invested: {investment.timeInvested ? new Date(investment.timeInvested * 1000).toLocaleString() : 'N/A'}</p><p>Profit Withdrawn Status: {hasWithdrawnProfit ? <span className='text-green-400'>Yes</span> : 'No'}</p><Link href={`/decks/${deckIdNumeric}`} className='text-purple-400 hover:underline inline-block mt-1'>View Deck Details →</Link>{txState.message && txState.status !== 'idle' && ( <p className={`text-center pt-2 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} </p> )}</div> )}
    </div> );
}