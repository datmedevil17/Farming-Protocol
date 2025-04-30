"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { investmentDeckManagerAddress, investmentDeckManagerABI, erc20ABI } from '@/lib/contracts';
import { formatBalance, fetchPlatformTokenDetails } from '@/lib/utils';
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';

export default function InvestmentForm({ deck }) {
  const { address, isConnected, chain } = useAccount();
  const [amount, setAmount] = useState('');
  const [txState, setTxState] = useState({ status: 'idle', message: null });
  const [tokenDetails, setTokenDetails] = useState(null);

  useEffect(() => { if (chain?.id) { setTokenDetails(null); fetchPlatformTokenDetails(chain.id).then(setTokenDetails).catch(err => { console.error("Failed fetch token details IF:", err); setTokenDetails({ address: undefined, symbol: 'ERROR', decimals: 18 }); }); } }, [chain?.id]);

  const investmentTokenAddress = tokenDetails?.address;
  const tokenDecimals = tokenDetails?.decimals ?? 18;
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';
  const deckIdNumeric = deck?.id;

  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useBalance({ address: address, token: investmentTokenAddress, chainId: chain?.id, query: { enabled: isConnected && !!address && !!investmentTokenAddress } });
  const balance = balanceData?.value ?? 0n;

  const parsedAmount = amount && tokenDetails ? parseUnits(amount, tokenDecimals) : 0n;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: investmentTokenAddress, abi: erc20ABI, functionName: 'allowance', args: [address, investmentDeckManagerAddress], chainId: chain?.id, query: { enabled: isConnected && !!address && !!investmentTokenAddress && parsedAmount > 0n } });
  const needsApproval = allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount;

  const { data: approveConfig, error: approveSimError } = useSimulateContract({ address: investmentTokenAddress, abi: erc20ABI, functionName: 'approve', args: [investmentDeckManagerAddress, parsedAmount], query: { enabled: needsApproval && !!address && parsedAmount > 0n && !!investmentTokenAddress }, });
  const { writeContractAsync: approveAsync, data: approveTxHash, isPending: isApprovingWrite } = useWriteContract();

  const { data: investConfig, error: investSimError } = useSimulateContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'invest', args: [deckIdNumeric, parsedAmount], query: { enabled: !needsApproval && !!address && deckIdNumeric !== undefined && parsedAmount > 0n && allowance !== undefined && allowance >= parsedAmount && !!investmentTokenAddress }, });
  const { writeContractAsync: investAsync, data: investTxHash, isPending: isInvestingWrite } = useWriteContract();

  useEffect(() => { if (approveSimError) console.error("Approve Sim Error:", approveSimError); }, [approveSimError]);
  useEffect(() => { if (investSimError) console.error("Invest Sim Error:", investSimError); }, [investSimError]);

  const { isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({ hash: approveTxHash, query: { enabled: !!approveTxHash, onSuccess: (data) => { console.log('Approval OK:', data.transactionHash); setTxState({ status: 'idle', message: 'Approval successful! You can now invest.' }); refetchAllowance(); setTimeout(() => setTxState(prev => ({ ...prev, message: null })), 4000); }, onError: (err) => { console.error("Approval receipt error:", err); setTxState({ status: 'error', message: `Approval failed: ${err.message}` }); } } });
  const { isLoading: isWaitingForInvestment } = useWaitForTransactionReceipt({ hash: investTxHash, query: { enabled: !!investTxHash, onSuccess: (data) => { console.log('Investment OK:', data.transactionHash); setTxState({ status: 'success', message: 'Investment successful!' }); setAmount(''); refetchBalance(); refetchAllowance(); setTimeout(() => setTxState({ status: 'idle', message: null }), 4000); }, onError: (err) => { console.error("Investment receipt error:", err); setTxState({ status: 'error', message: `Investment failed: ${err.message}` }); } } });

  const handleApprove = async () => { if (!approveConfig?.request) { setTxState({ status: 'error', message: `Cannot prepare approval. ${approveSimError?.shortMessage || ''}` }); return; } setTxState({ status: 'loading', message: 'Check wallet to approve...' }); try { await approveAsync(approveConfig.request); setTxState({ status: 'loading', message: 'Approving token spend...' }); } catch (err) { console.error("Approve write error:", err); setTxState({ status: 'error', message: `Approval cancelled or failed: ${err.shortMessage || err.message}` }); } };
  const handleInvest = async () => { if (!investConfig?.request) { setTxState({ status: 'error', message: `Cannot prepare investment. ${investSimError?.shortMessage || ''}` }); return; } setTxState({ status: 'loading', message: 'Check wallet to invest...' }); try { await investAsync(investConfig.request); setTxState({ status: 'loading', message: 'Processing investment...' }); } catch (err) { console.error("Invest write error:", err); setTxState({ status: 'error', message: `Investment cancelled or failed: ${err.shortMessage || err.message}` }); } };

  const minInvestment = deck?.minInvestment;
  const isBelowMin = minInvestment !== undefined && parsedAmount > 0n && parsedAmount < minInvestment;
  const insufficientBalance = parsedAmount > 0n && balance !== undefined && parsedAmount > balance;
  const isLoading = isApprovingWrite || isWaitingForApproval || isInvestingWrite || isWaitingForInvestment || !tokenDetails;
  const isLoadingApproval = isApprovingWrite || isWaitingForApproval;
  const isLoadingInvestment = isInvestingWrite || isWaitingForInvestment;
  const canSubmitApproval = approveConfig?.request && !isLoading && !insufficientBalance;
  const canSubmitInvestment = investConfig?.request && !isLoading && !insufficientBalance && !isBelowMin;

  if (!isConnected || !address) { return <Card><p className="text-center text-gray-400 text-sm">Connect wallet to invest.</p></Card>; }
  if (!deck) { return <Card><p className="text-center text-gray-500 text-sm">Deck data unavailable.</p></Card>; }
  if (deck.status !== 'active') { return <Card><p className="text-center text-yellow-500 text-sm">This deck is not active for investments.</p></Card>; }
  if (!tokenDetails) { return <Card><p className="text-center text-gray-500 text-sm animate-pulse">Loading token info...</p></Card>; }
  if (!tokenDetails.address) { return <Card><p className="text-center text-red-500 text-sm">Platform token not found for this network.</p></Card>; }
  if (!investmentDeckManagerAddress) { return <Card><p className="text-center text-red-500 text-sm">Platform contract address not set.</p></Card>; }


  return (
    <Card border={true} className="!bg-gray-800/80">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Invest in <span className='text-purple-300'>{deck.name}</span></h2>
       <div className="text-xs text-gray-400 mb-1 flex justify-between items-center"><span>Your Balance:</span><span className='font-medium text-gray-200'>{isLoadingBalance ? '...' : formatBalance(balance, tokenDecimals, 4)} {tokenSymbol}</span></div>
       {minInvestment !== undefined && minInvestment > 0n && (<div className="text-xs text-gray-400 mb-3 flex justify-between items-center"><span>Min Investment:</span><span className='font-medium text-gray-200'>{formatBalance(minInvestment, tokenDecimals, 2)} {tokenSymbol}</span></div>)}
      <div className='mb-4'>
        <label htmlFor={`amount-${deck.id}`} className="block text-sm font-medium text-gray-300 mb-1.5"> Amount ({tokenSymbol}) </label>
        <div className="relative"> <Input type="number" id={`amount-${deck.id}`} value={amount} onChange={(e) => { setAmount(e.target.value); if (txState.status === 'error' || txState.status === 'success') setTxState({ status: 'idle', message: null }); }} placeholder={`0.0`} min="0" step="any" disabled={isLoading} className={`pr-14 ${insufficientBalance || isBelowMin ? '!border-red-500/70 focus:!ring-red-500' : ''}`} /> <button onClick={() => amount !== formatUnits(balance, tokenDecimals) && setAmount(formatUnits(balance, tokenDecimals))} disabled={isLoading || balance === 0n} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-purple-700/80 hover:bg-purple-600 px-2 py-1 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"> Max </button> </div>
        {insufficientBalance && <p className="text-xs text-red-400 mt-1.5">Insufficient balance.</p>}
        {isBelowMin && <p className="text-xs text-red-400 mt-1.5">Amount below minimum investment.</p>}
      </div>
      <div className="space-y-3 pt-2">
          {needsApproval && ( <Button onClick={handleApprove} disabled={!canSubmitApproval} variant='warning' className="w-full" loading={isLoadingApproval}> {`Approve ${tokenSymbol}`} </Button> )}
          <Button onClick={handleInvest} disabled={!canSubmitInvestment} variant='primary' className="w-full" loading={isLoadingInvestment}> {'Invest Now'} </Button>
      </div>
      {txState.message && ( <p className={`text-xs text-center mt-3 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} </p> )}
    </Card>
  );
}