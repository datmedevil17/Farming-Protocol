// app/buy-token/page.jsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'; // <<< Added hooks
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { platformTokenAddress, platformTokenABI } from '@/lib/contracts'; // <<< Import platform token details
import { fetchPlatformTokenDetails, formatBalance } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function BuyTokenPage() {
  const { address, isConnected, chain } = useAccount();
  const [ethAmountStr, setEthAmountStr] = useState('');
  const [txState, setTxState] = useState({ status: 'idle', message: null });
  const [tokenDetails, setTokenDetails] = useState(null);
  const [fetchedTokenPrice, setFetchedTokenPrice] = useState(null); // Store fetched price

  // 1. Fetch Platform Token Details (includes symbol, decimals, address)
  useEffect(() => {
    if (chain?.id) {
        setTokenDetails(null);
        fetchPlatformTokenDetails(chain.id).then(setTokenDetails);
    }
  }, [chain?.id]);

  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';
  const tokenDecimals = tokenDetails?.decimals ?? 18;
  const platformTokenAddr = tokenDetails?.address; // This should match the imported platformTokenAddress

  // 2. Fetch Token Price from Contract
  const { data: priceData, isLoading: isLoadingPrice } = useReadContract({
      address: platformTokenAddr, // Use fetched/known token address
      abi: platformTokenABI,      // Use platform token ABI
      functionName: 'tokenPrice',
      chainId: chain?.id,
      query: { enabled: !!platformTokenAddr && !!chain?.id }
  });
  useEffect(() => { if (priceData) setFetchedTokenPrice(BigInt(priceData)); }, [priceData]);

  // 3. Fetch ETH Balance
  const { data: ethBalanceData, isLoading: isLoadingEthBalance, refetch: refetchEthBalance } = useBalance({ address: address, chainId: chain?.id, query: { enabled: isConnected && !!address } });
  const ethBalance = ethBalanceData?.value ?? 0n;
  const formattedEthBalance = formatBalance(ethBalance, 18, 6);

  // 4. Fetch Platform Token Balance
  const { data: tokenBalanceData, isLoading: isLoadingTokenBalance, refetch: refetchTokenBalance } = useBalance({ address: address, token: platformTokenAddr, chainId: chain?.id, query: { enabled: isConnected && !!address && !!platformTokenAddr } });
  const tokenBalance = tokenBalanceData?.value ?? 0n;
  const formattedTokenBalance = formatBalance(tokenBalance, tokenDecimals, 4);

  // 5. Calculate Estimated Tokens & Check Balance
  const parsedEthAmount = useMemo(() => { try { return ethAmountStr ? parseEther(ethAmountStr) : 0n; } catch { return 0n; } }, [ethAmountStr]);

  const estimatedTokensReceived = useMemo(() => {
      if (parsedEthAmount === 0n || !fetchedTokenPrice || fetchedTokenPrice === 0n || !tokenDetails) return '0';
      try {
        // Calculate: (ETH sent * 10^tokenDecimals) / pricePerToken (in wei)
        // Multiply first to maintain precision with BigInt
        const tokensBigInt = (parsedEthAmount * (10n ** BigInt(tokenDecimals))) / fetchedTokenPrice;
        return formatBalance(tokensBigInt, tokenDecimals, 4);
      } catch (e) { console.error("Error calculating estimated tokens:", e); return '0'; }
  }, [parsedEthAmount, fetchedTokenPrice, tokenDetails, tokenDecimals]);


  const insufficientEthBalance = parsedEthAmount > 0n && parsedEthAmount > ethBalance;
  const isLoading = txState.status === 'loading' || !tokenDetails || isLoadingPrice || isLoadingEthBalance || isLoadingTokenBalance;

  // --- Prepare Buy Tokens Tx ---
  const { data: buyConfig, error: buySimError } = useSimulateContract({
      address: platformTokenAddr, // Target the PlatformToken contract
      abi: platformTokenABI,
      functionName: 'buyTokens',
      args: [], // buyTokens takes no arguments
      value: parsedEthAmount, // Send ETH value with the transaction
      query: { enabled: isConnected && !!address && !!platformTokenAddr && parsedEthAmount > 0n && !insufficientEthBalance },
  });
  const { writeContractAsync: buyTokensAsync, data: buyTxHash, isPending: isBuyingWrite } = useWriteContract();

  // --- Wait for Buy Tx Receipt ---
  const { isLoading: isWaitingForBuy } = useWaitForTransactionReceipt({
      hash: buyTxHash,
      query: {
          enabled: !!buyTxHash,
          onSuccess: (data) => {
              console.log('Buy Tokens successful:', data.transactionHash);
              setTxState({ status: 'success', message: `Successfully bought tokens!` });
              setEthAmountStr('');
              refetchEthBalance();
              refetchTokenBalance();
              setTimeout(() => setTxState({ status: 'idle', message: null }), 5000);
          },
          onError: (err) => {
               console.error("Buy Tokens receipt error:", err);
               setTxState({ status: 'error', message: `Buy transaction failed: ${err.message}` });
          }
      }
  });


  // --- Actual Buy Handler ---
  const handleBuy = async () => {
    if (!buyConfig?.request) {
        setTxState({ status: 'error', message: `Cannot prepare transaction. ${buySimError?.shortMessage || 'Check amount/balance.'}` });
        return;
    }
    if (insufficientEthBalance || parsedEthAmount <= 0n) {
        setTxState({status: 'error', message: 'Invalid amount or insufficient ETH balance.'});
        return;
    }
    setTxState({ status: 'loading', message: 'Check wallet to confirm...' });
    try {
        await buyTokensAsync(buyConfig.request);
        setTxState({ status: 'loading', message: 'Submitting transaction...' });
        // The useWaitForTransactionReceipt hook handles the rest
    } catch (err) {
        console.error("Buy transaction write error:", err);
        setTxState({ status: 'error', message: `Transaction cancelled or failed: ${err.shortMessage || err.message}` });
    }
  };

  const isLoadingAny = isLoading || isBuyingWrite || isWaitingForBuy;

  // --- Render Checks ---
   if (!isConnected || !address) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-gray-400 text-sm">Please connect your wallet to buy tokens.</p></Card>; }
   if (!tokenDetails || isLoadingPrice) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-gray-400 text-sm animate-pulse">Loading token info...</p></Card>; }
   if (!platformTokenAddr) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Platform token address not configured.</p></Card>; }
   if (fetchedTokenPrice === null) { return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-red-500 text-sm">Could not load token price from contract.</p></Card>; }


  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-100">Buy {tokenSymbol}</h1>
      <Card border={true} className="!bg-gray-800/80">
        <div className="space-y-5">
            <div className='text-xs space-y-1'>
                 <div className='flex justify-between items-center text-gray-400'><span>Your Sepolia ETH Balance:</span><span className='font-medium text-gray-200'>{isLoadingEthBalance ? '...' : formattedEthBalance} ETH</span></div>
                 <div className='flex justify-between items-center text-gray-400'><span>Your {tokenSymbol} Balance:</span><span className='font-medium text-gray-200'>{isLoadingTokenBalance ? '...' : formattedTokenBalance} {tokenSymbol}</span></div>
                 <div className='flex justify-between items-center text-gray-400 pt-1'>
                    <span>Current Rate:</span>
                    {/* Display fetched price */}
                    <span className='font-medium text-gray-200'>1 {tokenSymbol} ≈ {formatBalance(fetchedTokenPrice, 18, 6)} ETH</span>
                 </div>
            </div>
            <hr className='border-gray-700/50' />
            <div>
                <label htmlFor="ethAmount" className="block text-sm font-medium text-gray-300 mb-1.5">Amount of Sepolia ETH to Spend</label>
                <div className="relative">
                     <Input id="ethAmount" type="number" value={ethAmountStr} onChange={(e) => { setEthAmountStr(e.target.value); setTxState({ status: 'idle', message: null }); }} placeholder="0.0" min="0" step="any" disabled={isLoadingAny} className={`pr-14 ${insufficientEthBalance ? '!border-red-500/70 focus:!ring-red-500' : ''}`} />
                     <button onClick={() => ethAmountStr !== formatEther(ethBalance) && setEthAmountStr(formatEther(ethBalance))} disabled={isLoadingAny || ethBalance === 0n} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-purple-700/80 hover:bg-purple-600 px-2 py-1 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"> Max </button>
                </div>
                {insufficientEthBalance && <p className="text-xs text-red-400 mt-1.5">Insufficient ETH balance.</p>}
            </div>
            <div className='text-sm'>
                <span className='text-gray-400'>You will receive (approx.): </span>
                <span className='font-medium text-purple-300'>{estimatedTokensReceived} {tokenSymbol}</span>
                <p className='text-xs text-gray-500 mt-1'>(Based on current contract price)</p>
            </div>
            <div className='pt-2'>
                <Button onClick={handleBuy} disabled={isLoadingAny || !buyConfig?.request || parsedEthAmount <= 0n || insufficientEthBalance} variant='primary' className="w-full" loading={isLoadingAny && txState.status === 'loading'}> Buy {tokenSymbol} with ETH </Button>
            </div>
            {txState.message && ( <p className={`text-sm text-center pt-2 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} </p> )}
            {buySimError && <p className='text-xs text-red-400 text-center mt-2'>Error: {buySimError.shortMessage}</p>}
        </div>
      </Card>
      <p className='text-xs text-center text-gray-500'>Note: Ensure you have enough Sepolia ETH for the purchase amount plus gas fees.</p>
    </div>
  );
}