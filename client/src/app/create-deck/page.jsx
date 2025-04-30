// app/create-deck/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem'; // Need formatUnits
import { investmentDeckManagerAddress, investmentDeckManagerABI, erc20ABI } from '@/lib/contracts';
import { formatBalance, fetchPlatformTokenDetails } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function CreateDeckPage() {
  const { address, isConnected, chain } = useAccount();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minInvestmentStr, setMinInvestmentStr] = useState('');
  const [txState, setTxState] = useState({ status: 'idle', message: null });
  const [tokenDetails, setTokenDetails] = useState(null);
  const [deckFee, setDeckFee] = useState(0n);

  useEffect(() => { if (chain?.id) { setTokenDetails(null); fetchPlatformTokenDetails(chain.id).then(setTokenDetails).catch(err => { console.error("Failed fetch token details CD:", err); setTokenDetails({ address: undefined, symbol: 'ERROR', decimals: 18 }); }); } }, [chain?.id]);
  const { data: feeData, isLoading: isLoadingFee } = useReadContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'deckCreationFee', chainId: chain?.id, query: { enabled: !!chain?.id && !!investmentDeckManagerAddress } });
  useEffect(() => { if (feeData !== undefined) setDeckFee(BigInt(feeData)); }, [feeData]);

  const investmentTokenAddress = tokenDetails?.address;
  const tokenDecimals = tokenDetails?.decimals ?? 18;
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';

  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useBalance({ address: address, token: investmentTokenAddress, chainId: chain?.id, query: { enabled: isConnected && !!address && !!investmentTokenAddress && deckFee > 0n } });
  const balance = balanceData?.value ?? 0n;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: investmentTokenAddress, abi: erc20ABI, functionName: 'allowance', args: [address, investmentDeckManagerAddress], chainId: chain?.id, query: { enabled: isConnected && !!address && !!investmentTokenAddress && deckFee > 0n } });
  const needsFeeApproval = deckFee > 0n && allowance !== undefined && allowance < deckFee;
  const hasSufficientFeeBalance = balance >= deckFee;

  const { data: approveFeeConfig, error: approveFeeSimError } = useSimulateContract({ address: investmentTokenAddress, abi: erc20ABI, functionName: 'approve', args: [investmentDeckManagerAddress, deckFee], query: { enabled: needsFeeApproval && !!address && deckFee > 0n && !!investmentTokenAddress }, });
  const { writeContractAsync: approveFeeAsync, data: approveFeeTxHash, isPending: isApprovingWrite } = useWriteContract();

  const minInvestmentParsed = minInvestmentStr && tokenDetails ? parseUnits(minInvestmentStr, tokenDecimals) : 0n;
  const canPrepareCreate = isConnected && !!address && name.trim() !== '' && description.trim() !== '' && minInvestmentParsed >= 0n && (!needsFeeApproval || (allowance !==undefined && allowance >= deckFee)) && !!investmentDeckManagerAddress;
  const { data: createDeckConfig, error: createDeckSimError } = useSimulateContract({ address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'createDeck', args: [name.trim(), description.trim(), minInvestmentParsed], query: { enabled: canPrepareCreate }, });
  const { writeContractAsync: createDeckAsync, data: createDeckTxHash, isPending: isCreatingWrite } = useWriteContract();

  useEffect(() => { if (approveFeeSimError) console.error("Approve Sim Error:", approveFeeSimError); }, [approveFeeSimError]);
  useEffect(() => { if (createDeckSimError) console.error("Create Sim Error:", createDeckSimError); }, [createDeckSimError]);

  const { isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({ hash: approveFeeTxHash, query: { enabled: !!approveFeeTxHash, onSuccess: () => { console.log('Fee Approval OK'); setTxState({ status: 'idle', message: 'Fee approved! You can now create.' }); refetchAllowance(); setTimeout(() => setTxState(prev => ({ ...prev, message: null })), 4000); }, onError: (err) => setTxState({ status: 'error', message: `Fee approval failed: ${err.message}` }), } });
  const { isLoading: isWaitingForCreation } = useWaitForTransactionReceipt({ hash: createDeckTxHash, query: { enabled: !!createDeckTxHash, onSuccess: (data) => { console.log('Deck Creation OK:', data.transactionHash); setTxState({ status: 'success', message: 'Deck created successfully!' }); setName(''); setDescription(''); setMinInvestmentStr(''); refetchBalance(); }, onError: (err) => setTxState({ status: 'error', message: `Deck creation failed: ${err.message}` }), } });

  const handleApproveFee = async () => { if (!approveFeeConfig?.request) { setTxState({ status: 'error', message: `Cannot prepare fee approval. ${approveFeeSimError?.shortMessage || ''}` }); return; } setTxState({ status: 'loading', message: 'Check wallet to approve fee...' }); try { await approveFeeAsync(approveFeeConfig.request); setTxState({ status: 'loading', message: 'Approving fee...' }); } catch (err) { setTxState({ status: 'error', message: `Fee approval cancelled or failed: ${err.shortMessage || err.message}` }); } };
  const handleCreateDeck = async () => { if (!createDeckConfig?.request) { setTxState({ status: 'error', message: `Cannot prepare deck creation. ${createDeckSimError?.shortMessage || ''}` }); return; } if (deckFee > 0n && !hasSufficientFeeBalance) { setTxState({ status: 'error', message: `Insufficient ${tokenSymbol} balance for creation fee.`}); return; } setTxState({ status: 'loading', message: 'Check wallet to create deck...' }); try { await createDeckAsync(createDeckConfig.request); setTxState({ status: 'loading', message: 'Creating deck...' }); } catch (err) { setTxState({ status: 'error', message: `Deck creation cancelled or failed: ${err.shortMessage || err.message}` }); } };

  const isLoading = isApprovingWrite || isWaitingForApproval || isCreatingWrite || isWaitingForCreation || !tokenDetails || isLoadingFee || (deckFee > 0n && isLoadingBalance);
  const isLoadingApproval = isApprovingWrite || isWaitingForApproval;
  const isLoadingCreation = isCreatingWrite || isWaitingForCreation;
  const canSubmitApproval = approveFeeConfig?.request && !isLoading && hasSufficientFeeBalance;
  const canSubmitCreation = createDeckConfig?.request && !isLoading && (deckFee === 0n || (hasSufficientFeeBalance && !needsFeeApproval));

  if (!isConnected || !address) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-gray-400 text-sm">Please connect your wallet to create a deck.</p></Card>; }
  if (!investmentDeckManagerAddress) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Platform contract address not configured.</p></Card>; }
  if (!tokenDetails || isLoadingFee) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-gray-400 text-sm animate-pulse">Loading creation requirements...</p></Card>; }
  if (!tokenDetails.address && deckFee > 0n) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Platform token not found. Cannot determine fee requirements.</p></Card>; }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Create New Investment Deck</h1>
      <Card border={true} className="!bg-gray-800/80">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateDeck(); }} className="space-y-5">
          <div><label htmlFor="deckName" className="block text-sm font-medium text-gray-300 mb-1.5">Deck Name</label><Input id="deckName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sepolia ETH Yield" required maxLength={64} disabled={isLoading} /></div>
          <div><label htmlFor="deckDescription" className="block text-sm font-medium text-gray-300 mb-1.5">Description</label><textarea id="deckDescription" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the investment strategy..." required maxLength={256} disabled={isLoading} className={`w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400/60 disabled:opacity-60 disabled:cursor-not-allowed transition-colors resize-none`} /></div>
          <div><label htmlFor="minInvestment" className="block text-sm font-medium text-gray-300 mb-1.5">Minimum Investment ({tokenSymbol || 'Units'})</label><Input id="minInvestment" type="number" value={minInvestmentStr} onChange={(e) => setMinInvestmentStr(e.target.value)} placeholder="e.g., 0.1" required min="0" step="any" disabled={isLoading} />{minInvestmentStr && minInvestmentParsed < 0n && <p className="text-xs text-red-400 mt-1.5">Minimum cannot be negative.</p>}</div>
          {deckFee > 0n && tokenDetails?.address && ( <div className='p-3 bg-gray-700/30 rounded-md border border-gray-600/50 text-sm space-y-2'><div className='flex justify-between items-center'><span className='text-gray-400'>Creation Fee:</span><span className='font-medium text-gray-100'>{formatBalance(deckFee, tokenDecimals, 2)} {tokenSymbol}</span></div><div className='flex justify-between items-center'><span className='text-gray-400'>Your Balance:</span><span className={`font-medium ${hasSufficientFeeBalance ? 'text-gray-100' : 'text-red-400'}`}>{isLoadingBalance ? '...' : formatBalance(balance, tokenDecimals, 4)} {tokenSymbol}</span></div>{!hasSufficientFeeBalance && <p className="text-xs text-red-400 text-center">Insufficient balance for fee.</p>}{needsFeeApproval && hasSufficientFeeBalance && ( <Button onClick={handleApproveFee} disabled={!canSubmitApproval} variant='warning' className="w-full !py-2 !text-sm" loading={isLoadingApproval}> Approve Fee Payment </Button> )}</div> )}
          <div className='pt-2'><Button type="submit" disabled={!canSubmitCreation} variant='primary' className="w-full" loading={isLoadingCreation}> Create Deck </Button></div>
          {txState.message && ( <p className={`text-sm text-center pt-2 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} {txState.status === 'success' && ( <Link href="/decks" className='ml-2 text-purple-400 hover:underline'>View Decks</Link> )} </p> )}
          {approveFeeSimError && needsFeeApproval && <p className='text-xs text-red-400 text-center mt-2'>Approval Error: {approveFeeSimError.shortMessage}</p>}
          {createDeckSimError && !needsFeeApproval && <p className='text-xs text-red-400 text-center mt-2'>Creation Error: {createDeckSimError.shortMessage}</p>}
        </form>
      </Card>
    </div> );
}