// components/AdminSettings.jsx
"use client";

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { formatBalance } from '@/lib/utils'; // No need for token fetcher here
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';

export default function AdminSettings({ currentPlatformFee, currentDeckFee, tokenDetails, onAdminActionSuccess }) {
  const { address, isConnected, chain } = useAccount();
  const [newPlatformFeeStr, setNewPlatformFeeStr] = useState('');
  const [newDeckFeeStr, setNewDeckFeeStr] = useState('');
  const [txState, setTxState] = useState({ status: 'idle', message: null, type: null }); // type: 'platform' or 'deck'

  // Set initial values when props are loaded/changed
  useEffect(() => {
    if (currentPlatformFee !== undefined) {
       setNewPlatformFeeStr(currentPlatformFee.toString());
    }
  }, [currentPlatformFee]);

  useEffect(() => {
    if (tokenDetails && currentDeckFee !== undefined) {
        setNewDeckFeeStr(formatUnits(currentDeckFee, tokenDetails.decimals));
    }
  }, [currentDeckFee, tokenDetails]);

  const tokenDecimals = tokenDetails?.decimals ?? 18;
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';

  // --- Prepare setPlatformFeePercent Tx ---
  const platformFeePercent = parseInt(newPlatformFeeStr, 10);
  const isValidPlatformFee = !isNaN(platformFeePercent) && platformFeePercent >= 0 && platformFeePercent <= 20;
  const hasPlatformFeeChanged = currentPlatformFee !== undefined && platformFeePercent !== currentPlatformFee;

  const { data: setPlatformFeeConfig, error: setPlatformFeeSimError } = useSimulateContract({
      address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'setPlatformFeePercent',
      args: [platformFeePercent],
      query: { enabled: isConnected && isValidPlatformFee && hasPlatformFeeChanged },
  });
  const { writeContractAsync: setPlatformFeeAsync, data: setPlatformFeeTxHash, isPending: isSettingPlatformFee } = useWriteContract();

  // --- Prepare setDeckCreationFee Tx ---
  let parsedDeckFee = 0n;
  let isValidDeckFee = false;
  try { if (newDeckFeeStr && tokenDetails) { parsedDeckFee = parseUnits(newDeckFeeStr, tokenDecimals); isValidDeckFee = parsedDeckFee >= 0n; } } catch { isValidDeckFee = false; }
  const hasDeckFeeChanged = currentDeckFee !== undefined && parsedDeckFee !== currentDeckFee;

  const { data: setDeckFeeConfig, error: setDeckFeeSimError } = useSimulateContract({
      address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'setDeckCreationFee',
      args: [parsedDeckFee],
      query: { enabled: isConnected && isValidDeckFee && hasDeckFeeChanged },
  });
  const { writeContractAsync: setDeckFeeAsync, data: setDeckFeeTxHash, isPending: isSettingDeckFee } = useWriteContract();

  // --- Wait for Tx Receipts ---
   const { isLoading: isWaitingPlatform } = useWaitForTransactionReceipt({ hash: setPlatformFeeTxHash, query: { enabled: !!setPlatformFeeTxHash, onSuccess: () => { setTxState({ status: 'success', message: 'Platform fee updated!', type: 'platform' }); if (onAdminActionSuccess) onAdminActionSuccess(); }, onError: (err) => setTxState({ status: 'error', message: `Fee update failed: ${err.message}`, type: 'platform' }) } });
   const { isLoading: isWaitingDeck } = useWaitForTransactionReceipt({ hash: setDeckFeeTxHash, query: { enabled: !!setDeckFeeTxHash, onSuccess: () => { setTxState({ status: 'success', message: 'Deck creation fee updated!', type: 'deck' }); if (onAdminActionSuccess) onAdminActionSuccess(); }, onError: (err) => setTxState({ status: 'error', message: `Fee update failed: ${err.message}`, type: 'deck' }) } });

  // --- Action Handlers ---
  const handleSetPlatformFee = async () => { if (!setPlatformFeeConfig?.request) { setTxState({ status: 'error', message: `Cannot prep tx. ${setPlatformFeeSimError?.shortMessage || ''}`, type: 'platform' }); return; } setTxState({ status: 'loading', message: 'Check wallet...', type: 'platform' }); try { await setPlatformFeeAsync(setPlatformFeeConfig.request); setTxState({ status: 'loading', message: 'Updating platform fee...', type: 'platform' }); } catch (err) { setTxState({ status: 'error', message: `Tx failed: ${err.shortMessage || err.message}`, type: 'platform' }); } };
  const handleSetDeckFee = async () => { if (!setDeckFeeConfig?.request) { setTxState({ status: 'error', message: `Cannot prep tx. ${setDeckFeeSimError?.shortMessage || ''}`, type: 'deck' }); return; } setTxState({ status: 'loading', message: 'Check wallet...', type: 'deck' }); try { await setDeckFeeAsync(setDeckFeeConfig.request); setTxState({ status: 'loading', message: 'Updating deck fee...', type: 'deck' }); } catch (err) { setTxState({ status: 'error', message: `Tx failed: ${err.shortMessage || err.message}`, type: 'deck' }); } };

  const isLoadingPlatform = isSettingPlatformFee || isWaitingPlatform;
  const isLoadingDeck = isSettingDeckFee || isWaitingDeck;
  const isLoading = isLoadingPlatform || isLoadingDeck; // General loading state for disabling inputs

  return (
    <Card border={true} className="!bg-gradient-to-br !from-indigo-900/30 !via-gray-850 !to-gray-850 border-indigo-500/50">
      <h2 className="text-xl font-semibold mb-6 text-indigo-300 border-b border-indigo-700/50 pb-2">Fee Management</h2>
      <div className="space-y-6">
        {/* Set Platform Fee */}
        <div className='space-y-2'>
            <label htmlFor="platformFee" className="block text-sm font-medium text-gray-300">Platform Profit Fee (%)</label>
             <div className='flex items-center gap-3'>
                 <Input id="platformFee" type="number" value={newPlatformFeeStr} onChange={(e) => setNewPlatformFeeStr(e.target.value)} placeholder="0-20" min="0" max="20" step="1" disabled={isLoading} className={`grow ${!isValidPlatformFee && newPlatformFeeStr !== '' ? '!border-red-500/70 focus:!ring-red-500' : ''}`} />
                 <Button onClick={handleSetPlatformFee} disabled={isLoading || !setPlatformFeeConfig?.request || !isValidPlatformFee || !hasPlatformFeeChanged} loading={isLoadingPlatform && txState.type === 'platform'} variant='secondary' small> Set Fee </Button>
            </div>
            {!isValidPlatformFee && newPlatformFeeStr !== '' && <p className="text-xs text-red-400 mt-1">Fee must be between 0 and 20.</p>}
            {setPlatformFeeSimError && hasPlatformFeeChanged && <p className='text-xs text-red-400 mt-1'>Sim Error: {setPlatformFeeSimError.shortMessage}</p>}
            {txState.type === 'platform' && txState.message && ( <p className={`text-xs text-center pt-1 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} </p> )}
        </div>

        {/* Set Deck Creation Fee */}
        <div className='space-y-2'>
             <label htmlFor="deckFee" className="block text-sm font-medium text-gray-300">Deck Creation Fee ({tokenSymbol})</label>
             <div className='flex items-center gap-3'>
                <Input id="deckFee" type="number" value={newDeckFeeStr} onChange={(e) => setNewDeckFeeStr(e.target.value)} placeholder="e.g., 1.0" min="0" step="any" disabled={isLoading || !tokenDetails} className={`grow ${!isValidDeckFee && newDeckFeeStr !== '' ? '!border-red-500/70 focus:!ring-red-500' : ''}`} />
                 <Button onClick={handleSetDeckFee} disabled={isLoading || !setDeckFeeConfig?.request || !isValidDeckFee || !hasDeckFeeChanged} loading={isLoadingDeck && txState.type === 'deck'} variant='secondary' small> Set Fee </Button>
            </div>
            {!isValidDeckFee && newDeckFeeStr !== '' && <p className="text-xs text-red-400 mt-1">Invalid fee amount.</p>}
             {setDeckFeeSimError && hasDeckFeeChanged && <p className='text-xs text-red-400 mt-1'>Sim Error: {setDeckFeeSimError.shortMessage}</p>}
             {txState.type === 'deck' && txState.message && ( <p className={`text-xs text-center pt-1 font-medium ${ txState.status === 'error' ? 'text-red-400' : txState.status === 'success' ? 'text-green-400' : 'text-blue-400' }`}> {txState.message} </p> )}
        </div>
      </div>
    </Card>
  );
}