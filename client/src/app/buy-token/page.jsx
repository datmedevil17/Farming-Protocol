// app/buy-token/page.jsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
// ---> These imports now point to the NEW address/ABI <---
import { platformTokenAddress, platformTokenABI } from '@/lib/contracts';
import { fetchPlatformTokenDetails, formatBalance } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function BuyTokenPage() {
  const { address, isConnected, chain } = useAccount();
  const [rbtcAmountStr, setRbtcAmountStr] = useState(''); // Renamed back for rootstock
  const [txState, setTxState] = useState({ status: 'idle', message: null });
  const [tokenDetails, setTokenDetails] = useState(null);
  const [fetchedTokenPrice, setFetchedTokenPrice] = useState(null);

  useEffect(() => { if (chain?.id) { setTokenDetails(null); fetchPlatformTokenDetails(chain.id).then(setTokenDetails); } }, [chain?.id]);

  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';
  const tokenDecimals = tokenDetails?.decimals ?? 18;
  // ---> Uses the new address from the import <---
  const thePlatformTokenAddress = platformTokenAddress;

  // Fetch Token Price using the correct address and ABI
  const { data: priceData, isLoading: isLoadingPrice } = useReadContract({ address: thePlatformTokenAddress, abi: platformTokenABI, functionName: 'tokenPrice', chainId: chain?.id, query: { enabled: !!thePlatformTokenAddress && !!chain?.id } });
  useEffect(() => { if (priceData) setFetchedTokenPrice(BigInt(priceData)); }, [priceData]);

  // Fetch RBTC Balance
  const { data: rbtcBalanceData, isLoading: isLoadingRbtcBalance, refetch: refetchRbtcBalance } = useBalance({ address: address, chainId: chain?.id, query: { enabled: isConnected && !!address } });
  const rbtcBalance = rbtcBalanceData?.value ?? 0n;
  const formattedRbtcBalance = formatBalance(rbtcBalance, 18, 6);

  // Fetch Platform Token Balance
  const { data: tokenBalanceData, isLoading: isLoadingTokenBalance, refetch: refetchTokenBalance } = useBalance({ address: address, token: thePlatformTokenAddress, chainId: chain?.id, query: { enabled: isConnected && !!address && !!thePlatformTokenAddress } });
  const tokenBalance = tokenBalanceData?.value ?? 0n;
  const formattedTokenBalance = formatBalance(tokenBalance, tokenDecimals, 4);

  const isLoading = txState.status === 'loading' || !tokenDetails || isLoadingPrice || isLoadingRbtcBalance || isLoadingTokenBalance;

  const parsedRbtcAmount = useMemo(() => { try { return rbtcAmountStr ? parseEther(rbtcAmountStr) : 0n; } catch { return 0n; } }, [rbtcAmountStr]);
  const estimatedTokensReceived = useMemo(() => { if (parsedRbtcAmount === 0n || !fetchedTokenPrice || fetchedTokenPrice === 0n || !tokenDetails) return '0'; try { const tokensBigInt = (parsedRbtcAmount * (10n ** BigInt(tokenDecimals))) / fetchedTokenPrice; return formatBalance(tokensBigInt, tokenDecimals, 4); } catch (e) { console.error("Error estimating tokens:", e); return '0'; } }, [parsedRbtcAmount, fetchedTokenPrice, tokenDetails, tokenDecimals]);
  const insufficientRbtcBalance = parsedRbtcAmount > 0n && parsedRbtcAmount > rbtcBalance;

  // Prepare Buy Tokens Tx using correct address/ABI
  const { data: buyConfig, error: buySimError } = useSimulateContract({ address: thePlatformTokenAddress, abi: platformTokenABI, functionName: 'buyTokens', args: [], value: parsedRbtcAmount, query: { enabled: isConnected && !!address && !!thePlatformTokenAddress && parsedRbtcAmount > 0n && !insufficientRbtcBalance }, });
  const { writeContractAsync: buyTokensAsync, data: buyTxHash, isPending: isBuyingWrite } = useWriteContract();
  const { isLoading: isWaitingForBuy } = useWaitForTransactionReceipt({ hash: buyTxHash, query: { enabled: !!buyTxHash, onSuccess: (data) => { console.log('Buy OK:', data.transactionHash); setTxState({ status: 'success', message: `Bought tokens!` }); setRbtcAmountStr(''); refetchRbtcBalance(); refetchTokenBalance(); setTimeout(() => setTxState({ status: 'idle', message: null }), 5000); }, onError: (err) => { console.error("Buy receipt error:", err); setTxState({ status: 'error', message: `Buy failed: ${err.message}` }); } } });

  // Actual Buy Handler
  const handleBuy = async () => { if (!buyConfig?.request) { setTxState({ status: 'error', message: `Cannot prepare tx. ${buySimError?.shortMessage || 'Check amount/balance.'}` }); return; } if (insufficientRbtcBalance || parsedRbtcAmount <= 0n) { setTxState({status: 'error', message: 'Invalid amount or insufficient RBTC balance.'}); return; } setTxState({ status: 'loading', message: 'Check wallet...' }); try { await buyTokensAsync(buyConfig.request); setTxState({ status: 'loading', message: 'Submitting...' }); } catch (err) { console.error("Buy write error:", err); setTxState({ status: 'error', message: `Tx cancelled or failed: ${err.shortMessage || err.message}` }); } };

  const isLoadingAny = isLoading || isBuyingWrite || isWaitingForBuy;

  // Render Checks
   if (!isConnected || !address) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-gray-400 text-sm">Please connect your wallet to buy tokens.</p></Card>; }
   if (isLoadingAny && txState.status === 'idle') { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-gray-400 text-sm animate-pulse">Loading token info and balances...</p></Card>; }
   if (!thePlatformTokenAddress) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Platform token address not configured.</p></Card>; }
   if (fetchedTokenPrice === null && !isLoadingPrice) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Could not load token price from contract.</p></Card>; }


  return (
    <div className="max-w-md mx-auto space-y-6"> <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-100">Buy {tokenSymbol}</h1> <Card border={true} className="!bg-gray-800/80"> <div className="space-y-5"> <div className='text-xs space-y-1'> <div className='flex justify-between items-center text-gray-400'><span>Your RBTC Balance:</span><span className='font-medium text-gray-200'>{isLoadingRbtcBalance ? '...' : formattedRbtcBalance} RBTC</span></div> <div className='flex justify-between items-center text-gray-400'><span>Your {tokenSymbol} Balance:</span><span className='font-medium text-gray-200'>{isLoadingTokenBalance ? '...' : formattedTokenBalance} {tokenSymbol}</span></div> <div className='flex justify-between items-center text-gray-400 pt-1'><span>Current Rate:</span><span className='font-medium text-gray-200'>{isLoadingPrice ? '...' : `1 ${tokenSymbol} ≈ ${formatBalance(fetchedTokenPrice, 18, 6)} RBTC`}</span></div> </div> <hr className='border-gray-700/50' /> <div> <label htmlFor="rbtcAmount" className="block text-sm font-medium text-gray-300 mb-1.5">Amount of RBTC to Spend</label> <div className="relative"> <Input id="rbtcAmount" type="number" value={rbtcAmountStr} onChange={(e) => { setRbtcAmountStr(e.target.value); setTxState({ status: 'idle', message: null }); }} placeholder="0.0" min="0" step="any" disabled={isLoadingAny} className={`pr-14 ${insufficientRbtcBalance ? '!border-red-500/70 focus:!ring-red-500' : ''}`} /> <button onClick={() => rbtcAmountStr !== formatEther(rbtcBalance) && setRbtcAmountStr(formatEther(rbtcBalance))} disabled={isLoadingAny || rbtcBalance === 0n} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-purple-700/80 hover:bg-purple-600 px-2 py-1 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"> Max </button> </div> {insufficientRbtcBalance && <p className="text-xs text-red-400 mt-1.5">Insufficient RBTC balance.</p>} </div> <div className='text-sm'> <span className='text-gray-400'>You will receive (approx.): </span> <span className='font-medium text-purple-300'>{estimatedTokensReceived} {tokenSymbol}</span> <p className='text-xs text-gray-500 mt-1'>(Based on current contract price)</p> </div> <div className='pt-2'> <Button onClick={handleBuy} disabled={isLoadingAny || !buyConfig?.request || parsedRbtcAmount <= 0n || insufficientRbtcBalance} variant='primary' className="w-full" loading={isLoadingAny && txState.status === 'loading'}> Buy {tokenSymbol} with RBTC </Button> </div> {txState.message && ( <p className={`text-sm text-center pt-2 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} </p> )} {buySimError && <p className='text-xs text-red-400 text-center mt-2'>Error: {buySimError.shortMessage}</p>} </div> </Card> <p className='text-xs text-center text-gray-500'>Note: Ensure you have enough RBTC/tRBTC for purchase amount plus gas fees.</p> </div>
  );
}