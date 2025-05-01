// components/AddProfitForm.jsx
"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { investmentDeckManagerAddress, investmentDeckManagerABI, erc20ABI } from '@/lib/contracts';
import { formatBalance } from '@/lib/utils';
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';

export default function AddProfitForm({ deck, tokenDetails, onProfitAdded }) {
  const { address, isConnected, chain } = useAccount();
  const [amountStr, setAmountStr] = useState('');
  const [txState, setTxState] = useState({ status: 'idle', message: null });

  // Component only rendered if user is creator, so we don't need extra checks here
  const isCreator = isConnected && address?.toLowerCase() === deck?.creator?.toLowerCase();

  const investmentTokenAddress = tokenDetails?.address;
  const tokenDecimals = tokenDetails?.decimals ?? 18;
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';
  const deckIdNumeric = deck?.id;

  // Check Creator's balance of the platform token
  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useBalance({
    address: address, // Creator's address
    token: investmentTokenAddress,
    chainId: chain?.id,
    query: { enabled: isCreator && !!investmentTokenAddress }
  });
  const balance = balanceData?.value ?? 0n;

  // Check Creator's allowance for the InvestmentPlatform contract
  const parsedAmount = amountStr && tokenDetails ? parseUnits(amountStr, tokenDecimals) : 0n;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: investmentTokenAddress, abi: erc20ABI, functionName: 'allowance',
    args: [address, investmentDeckManagerAddress], // owner: creator, spender: platform
    chainId: chain?.id,
    query: { enabled: isCreator && !!investmentTokenAddress && parsedAmount > 0n }
  });
  const needsApproval = allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount;
  const hasSufficientBalance = balance >= parsedAmount;

  // --- Prepare Approve Tx ---
  const { data: approveConfig, error: approveSimError } = useSimulateContract({
      address: investmentTokenAddress, abi: erc20ABI, functionName: 'approve',
      args: [investmentDeckManagerAddress, parsedAmount],
      query: { enabled: needsApproval && isCreator && parsedAmount > 0n },
  });
  const { writeContractAsync: approveAsync, data: approveTxHash, isPending: isApprovingWrite } = useWriteContract();

  // --- Prepare addProfit Tx ---
  const { data: addProfitConfig, error: addProfitSimError } = useSimulateContract({
      address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'addProfit',
      args: [deckIdNumeric, parsedAmount],
      query: { enabled: !needsApproval && isCreator && deckIdNumeric !== undefined && parsedAmount > 0n && hasSufficientBalance && (allowance !== undefined && allowance >= parsedAmount) },
  });
  const { writeContractAsync: addProfitAsync, data: addProfitTxHash, isPending: isAddingProfitWrite } = useWriteContract();

  // --- Wait for Tx Receipts ---
   const { isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({ hash: approveTxHash, query: { enabled: !!approveTxHash, onSuccess: () => { setTxState({ status: 'idle', message: 'Approval successful! You can now add profit.' }); refetchAllowance(); setTimeout(() => setTxState(prev => ({ ...prev, message: null })), 4000); }, onError: (err) => setTxState({ status: 'error', message: `Approval failed: ${err.message}` }), } });
   const { isLoading: isWaitingForProfitAdd } = useWaitForTransactionReceipt({ hash: addProfitTxHash, query: { enabled: !!addProfitTxHash, onSuccess: (data) => { setTxState({ status: 'success', message: 'Profit added successfully!' }); setAmountStr(''); refetchBalance(); if(onProfitAdded) onProfitAdded(); setTimeout(() => setTxState({ status: 'idle', message: null }), 4000); }, onError: (err) => setTxState({ status: 'error', message: `Adding profit failed: ${err.message}` }), } });

  // --- Action Handlers ---
  const handleApprove = async () => { if (!approveConfig?.request) { setTxState({ status: 'error', message: `Cannot prep approval. ${approveSimError?.shortMessage || ''}` }); return; } setTxState({ status: 'loading', message: 'Check wallet to approve...' }); try { await approveAsync(approveConfig.request); setTxState({ status: 'loading', message: 'Approving token spend...' }); } catch (err) { setTxState({ status: 'error', message: `Approval failed: ${err.shortMessage || err.message}` }); } };
  const handleAddProfit = async () => { if (!addProfitConfig?.request) { setTxState({ status: 'error', message: `Cannot prep add profit. ${addProfitSimError?.shortMessage || ''}` }); return; } if (!hasSufficientBalance) { setTxState({ status: 'error', message: `Insufficient ${tokenSymbol} balance.`}); return; } setTxState({ status: 'loading', message: 'Check wallet to add profit...' }); try { await addProfitAsync(addProfitConfig.request); setTxState({ status: 'loading', message: 'Adding profit...' }); } catch (err) { setTxState({ status: 'error', message: `Add profit failed: ${err.shortMessage || err.message}` }); } };

  // --- Derived State ---
  const isLoading = isApprovingWrite || isWaitingForApproval || isAddingProfitWrite || isWaitingForProfitAdd || !tokenDetails;
  const isLoadingApproval = isApprovingWrite || isWaitingForApproval;
  const isLoadingAdd = isAddingProfitWrite || isWaitingForProfitAdd;
  const canSubmitApproval = approveConfig?.request && !isLoading && hasSufficientBalance;
  const canSubmitAddProfit = addProfitConfig?.request && !isLoading && hasSufficientBalance && !needsApproval;

  // Don't render if not creator (though parent should handle this)
  if (!isCreator) return null;
  if (!tokenDetails) return <Card><p className='text-xs animate-pulse'>Loading token info...</p></Card>;

  return (
    <Card border={true} className="!bg-gray-800/60 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-yellow-300">Add Profit (Creator Action)</h3>
      <p className='text-xs text-gray-400 mb-3'>Add profits generated externally back to the deck. This amount will be distributed proportionally to investors when they withdraw profit.</p>

       <div className="text-xs text-gray-400 mb-3 flex justify-between items-center">
           <span>Your Balance:</span>
           <span className='font-medium text-gray-200'>{isLoadingBalance ? '...' : formatBalance(balance, tokenDecimals, 4)} {tokenSymbol}</span>
        </div>

      <div className='mb-4'>
        <label htmlFor={`profitAmount-${deck.id}`} className="block text-sm font-medium text-gray-300 mb-1.5">Profit Amount ({tokenSymbol})</label>
        <Input
          id={`profitAmount-${deck.id}`}
          type="number" value={amountStr}
          onChange={(e) => { setAmountStr(e.target.value); if (txState.status === 'error' || txState.status === 'success') setTxState({ status: 'idle', message: null }); }}
          placeholder="0.0" min="0" step="any" disabled={isLoading}
          className={`${!hasSufficientBalance && parsedAmount > 0n ? '!border-red-500/70 focus:!ring-red-500' : ''}`}
         />
         {!hasSufficientBalance && parsedAmount > 0n && <p className="text-xs text-red-400 mt-1.5">Insufficient balance.</p>}
      </div>

      <div className="space-y-3 pt-1">
          {needsApproval && ( <Button onClick={handleApprove} disabled={!canSubmitApproval} variant='warning' className="w-full !py-2 !text-sm" loading={isLoadingApproval}> {`Approve ${tokenSymbol} for Platform`} </Button> )}
          <Button onClick={handleAddProfit} disabled={!canSubmitAddProfit} variant='primary' className="w-full" loading={isLoadingAdd}> Add Profit to Deck </Button>
      </div>

      {txState.message && ( <p className={`text-xs text-center mt-3 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} </p> )}
      {approveSimError && needsApproval && <p className='text-xs text-red-400 text-center mt-2'>Approval Error: {approveSimError.shortMessage}</p>}
      {addProfitSimError && !needsApproval && <p className='text-xs text-red-400 text-center mt-2'>Add Profit Error: {addProfitSimError.shortMessage}</p>}
    </Card>
  );
}