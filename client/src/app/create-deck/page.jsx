"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAccount, useBalance, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { investmentDeckManagerAddress, investmentDeckManagerABI, erc20ABI } from '@/lib/contracts';
import { formatBalance, fetchPlatformTokenDetails } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Coins, Wallet, Square, Cuboid, Gem } from 'lucide-react';

// --- React Three Fiber Imports ---
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { /* OrbitControls, */ Octahedron, Environment, Stars /* Replaced Points/PointMaterial with Stars */ } from '@react-three/drei';
// --- End React Three Fiber Imports ---


// --- Removed BackgroundParticles Component ---


// --- Component for the Mouse-Following Crystal (Remains the same) ---
function FollowingCrystal() {
  const meshRef = useRef();
  const { viewport, pointer } = useThree();

  const targetQuaternion = useRef(new THREE.Quaternion()).current;
  const currentQuaternion = useRef(new THREE.Quaternion()).current;
  const targetPosition = useRef(new THREE.Vector3()).current;
  const tempMatrix = useRef(new THREE.Matrix4()).current;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Calculate Target Position (same logic)
    targetPosition.x = (pointer.x * viewport.width) / 2;
    targetPosition.y = (pointer.y * viewport.height) / 2;
    targetPosition.z = 2;

    // Calculate Target Rotation (same logic)
    tempMatrix.lookAt(meshRef.current.position, targetPosition, meshRef.current.up);
    targetQuaternion.setFromRotationMatrix(tempMatrix);

    // Smoothly Interpolate Rotation (same logic)
    currentQuaternion.copy(meshRef.current.quaternion);
    currentQuaternion.slerp(targetQuaternion, delta * 5.0);
    meshRef.current.quaternion.copy(currentQuaternion);

  });

  return (
    <Octahedron
        ref={meshRef}
        args={[1.4, 0]} // Radius, detail level (0 for sharp edges)
        position={[0, 0.1, 0]}
    >
         <meshPhysicalMaterial
            metalness={0.1}
            roughness={0.05}
            transmission={0.95}
            thickness={1.5}
            ior={2.4}
            attenuationColor="#e0f2fe"
            attenuationDistance={0.5}
        />
    </Octahedron>
  );
}

// --- Main Animation Scene Setup ---
function CrystalFollowAnimation() {
  return (
    <Canvas camera={{ position: [0, 0.5, 6], fov: 55 }}>
      {/* Lighting (Remains the same) */}
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 10, 8]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-8, -5, -10]} intensity={0.6} color="#f0f9ff" />
      <directionalLight position={[5, 5, -5]} intensity={0.8} color="#ffffff"/>
      <spotLight
          position={[0, 15, 0]}
          angle={0.3}
          penumbra={0.5}
          intensity={1.2}
          castShadow
          color="#e0f2fe"
      />


      <Suspense fallback={null}>
        {/* *** ADDED STARS BACKGROUND *** */}
        <Stars
            radius={80} // Distance of the stars sphere
            depth={50} // Depth of the stars volume
            count={5000} // Number of stars
            factor={4} // Size factor of stars
            saturation={0} // Saturation, 0 is white
            fade // Fade stars near camera
            speed={0.5} // Animation speed (rotation)
        />

        {/* The main crystal element */}
        <FollowingCrystal />

        {/* Environment for reflections only, not background */}
        <Environment preset="apartment" background={false} blur={0.4} />
      </Suspense>

    </Canvas>
  );
}
// --- End Animation Components ---


export default function CreateDeckPage() {
  const { address, isConnected, chain } = useAccount();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minInvestmentStr, setMinInvestmentStr] = useState('');
  const [txState, setTxState] = useState({ status: 'idle', message: null });
  const [tokenDetails, setTokenDetails] = useState(null);
  const [deckFee, setDeckFee] = useState(0n);
  const [isSuccess, setIsSuccess] = useState(false);

  // ... (Existing hooks and state logic remains the same) ...
   useEffect(() => {
    if (chain?.id) {
      setTokenDetails(null);
      fetchPlatformTokenDetails(chain.id)
        .then(setTokenDetails)
        .catch(err => {
          console.error("Failed fetch token details CD:", err);
          setTokenDetails({ address: undefined, symbol: 'ERROR', decimals: 18 });
        });
    }
  }, [chain?.id]);

  const { data: feeData, isLoading: isLoadingFee } = useReadContract({
    address: investmentDeckManagerAddress,
    abi: investmentDeckManagerABI,
    functionName: 'deckCreationFee',
    chainId: chain?.id,
    query: { enabled: !!chain?.id && !!investmentDeckManagerAddress }
  });

  useEffect(() => {
    if (feeData !== undefined) setDeckFee(BigInt(feeData));
  }, [feeData]);

  const investmentTokenAddress = tokenDetails?.address;
  const tokenDecimals = tokenDetails?.decimals ?? 18;
  const tokenSymbol = tokenDetails?.symbol || 'TOKEN';

  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useBalance({
    address: address,
    token: investmentTokenAddress,
    chainId: chain?.id,
    query: { enabled: isConnected && !!address && !!investmentTokenAddress && deckFee > 0n }
  });

  const balance = balanceData?.value ?? 0n;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: investmentTokenAddress,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address, investmentDeckManagerAddress],
    chainId: chain?.id,
    query: { enabled: isConnected && !!address && !!investmentTokenAddress && deckFee > 0n }
  });

  const needsFeeApproval = deckFee > 0n && allowance !== undefined && allowance < deckFee;
  const hasSufficientFeeBalance = balance >= deckFee;

  const { data: approveFeeConfig, error: approveFeeSimError } = useSimulateContract({
    address: investmentTokenAddress,
    abi: erc20ABI,
    functionName: 'approve',
    args: [investmentDeckManagerAddress, deckFee],
    query: { enabled: needsFeeApproval && !!address && deckFee > 0n && !!investmentTokenAddress },
  });

  const { writeContractAsync: approveFeeAsync, data: approveFeeTxHash, isPending: isApprovingWrite } = useWriteContract();

  const minInvestmentParsed = minInvestmentStr && tokenDetails ? parseUnits(minInvestmentStr, tokenDecimals) : 0n;
  const canPrepareCreate = isConnected && !!address && name.trim() !== '' && description.trim() !== '' && minInvestmentParsed >= 0n && (!needsFeeApproval || (allowance !==undefined && allowance >= deckFee)) && !!investmentDeckManagerAddress;

  const { data: createDeckConfig, error: createDeckSimError } = useSimulateContract({
    address: investmentDeckManagerAddress,
    abi: investmentDeckManagerABI,
    functionName: 'createDeck',
    args: [name.trim(), description.trim(), minInvestmentParsed],
    query: { enabled: canPrepareCreate },
  });

  const { writeContractAsync: createDeckAsync, data: createDeckTxHash, isPending: isCreatingWrite } = useWriteContract();

  useEffect(() => {
    if (approveFeeSimError) console.error("Approve Sim Error:", approveFeeSimError);
  }, [approveFeeSimError]);

  useEffect(() => {
    if (createDeckSimError) console.error("Create Sim Error:", createDeckSimError);
  }, [createDeckSimError]);

  const { isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({
    hash: approveFeeTxHash,
    query: {
      enabled: !!approveFeeTxHash,
      onSuccess: () => {
        console.log('Fee Approval OK');
        setTxState({ status: 'idle', message: 'Fee approved! You can now create.' });
        refetchAllowance();
        setTimeout(() => setTxState(prev => ({ ...prev, message: null })), 4000);
      },
      onError: (err) => setTxState({ status: 'error', message: `Fee approval failed: ${err.message}` }),
    }
  });

  const { isLoading: isWaitingForCreation } = useWaitForTransactionReceipt({
    hash: createDeckTxHash,
    query: {
      enabled: !!createDeckTxHash,
      onSuccess: (data) => {
        console.log('Deck Creation OK:', data.transactionHash);
        setTxState({ status: 'success', message: 'Deck created successfully!' });
        setIsSuccess(true);
        refetchBalance();
      },
      onError: (err) => setTxState({ status: 'error', message: `Deck creation failed: ${err.message}` }),
    }
  });

  const handleApproveFee = async () => {
    if (!approveFeeConfig?.request) {
      setTxState({ status: 'error', message: `Cannot prepare fee approval. ${approveFeeSimError?.shortMessage || ''}` });
      return;
    }
    setTxState({ status: 'loading', message: 'Check wallet to approve fee...' });
    try {
      await approveFeeAsync(approveFeeConfig.request);
      setTxState({ status: 'loading', message: 'Approving fee...' });
    } catch (err) {
      setTxState({ status: 'error', message: `Fee approval cancelled or failed: ${err.shortMessage || err.message}` });
    }
  };

  const handleCreateDeck = async () => {
    if (!createDeckConfig?.request) {
      setTxState({ status: 'error', message: `Cannot prepare deck creation. ${createDeckSimError?.shortMessage || ''}` });
      return;
    }
    if (deckFee > 0n && !hasSufficientFeeBalance) {
      setTxState({ status: 'error', message: `Insufficient ${tokenSymbol} balance for creation fee.`});
      return;
    }
    setTxState({ status: 'loading', message: 'Check wallet to create deck...' });
    try {
      await createDeckAsync(createDeckConfig.request);
      setTxState({ status: 'loading', message: 'Creating deck...' });
    } catch (err) {
      setTxState({ status: 'error', message: `Deck creation cancelled or failed: ${err.shortMessage || err.message}` });
    }
  };

  const isLoading = isApprovingWrite || isWaitingForApproval || isCreatingWrite || isWaitingForCreation || !tokenDetails || isLoadingFee || (deckFee > 0n && isLoadingBalance);
  const isLoadingApproval = isApprovingWrite || isWaitingForApproval;
  const isLoadingCreation = isCreatingWrite || isWaitingForCreation;
  const canSubmitApproval = approveFeeConfig?.request && !isLoading && hasSufficientFeeBalance;
  const canSubmitCreation = createDeckConfig?.request && !isLoading && (deckFee === 0n || (hasSufficientFeeBalance && !needsFeeApproval));


  // --- Conditional Rendering for Wallet/Config/Loading States ---
  // ... (This part remains unchanged) ...
   if (!isConnected || !address) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <Card className="text-center p-12 max-w-md mx-auto bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-80" />
          <h2 className="text-xl font-bold text-white mb-3">Wallet Connection Required</h2>
          <p className="text-gray-400 text-sm mb-6">Please connect your wallet to create an investment deck.</p>
          <p className="text-gray-500 text-xs mt-4">(Connect Wallet button needed)</p>
        </Card>
      </div>
    );
  }

  if (!investmentDeckManagerAddress) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <Card className="text-center p-12 max-w-md mx-auto bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700">
          <p className="text-red-500 text-sm">Platform contract address not configured.</p>
        </Card>
      </div>
    );
  }

  if (!tokenDetails || isLoadingFee) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <Card className="text-center p-12 max-w-md mx-auto bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700">
          <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-purple-500/30 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading creation requirements...</p>
        </Card>
      </div>
    );
  }

  if (!tokenDetails.address && deckFee > 0n) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <Card className="text-center p-12 max-w-md mx-auto bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700">
          <p className="text-red-500 text-sm">Platform token not found. Cannot determine fee requirements.</p>
        </Card>
      </div>
    );
  }
  // --- End Conditional Rendering ---


  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
         <Gem className="w-7 h-7 text-blue-300" />
         Create Your Investment Deck
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <Card border={true} className="!bg-gray-800/80 border-gray-700 p-6 h-full">
           {/* --- Form/Success Content (Remains Unchanged) --- */}
           {!isSuccess ? (
             <form onSubmit={(e) => { e.preventDefault(); handleCreateDeck(); }} className="space-y-6">
              {/* Form fields... */}
               <div>
                <label htmlFor="deckName" className="block text-sm font-medium text-gray-300 mb-2">Deck Name</label>
                <Input
                  id="deckName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Diamond Hands Fund"
                  required
                  maxLength={64}
                  disabled={isLoading}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400/60"
                />
              </div>

              <div>
                <label htmlFor="deckDescription" className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  id="deckDescription"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the high-yield investment strategy..."
                  required
                  maxLength={256}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400/60 disabled:opacity-60 disabled:cursor-not-allowed transition-colors resize-none"
                />
              </div>

              <div>
                <label htmlFor="minInvestment" className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Investment ({tokenSymbol || 'Units'})
                </label>
                <Input
                  id="minInvestment"
                  type="number"
                  value={minInvestmentStr}
                  onChange={(e) => setMinInvestmentStr(e.target.value)}
                  placeholder="e.g., 1.0"
                  required
                  min="0"
                  step="any"
                  disabled={isLoading}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400/60"
                />
                {minInvestmentStr && minInvestmentParsed < 0n &&
                  <p className="text-xs text-red-400 mt-1.5">Minimum cannot be negative.</p>
                }
              </div>

              {deckFee > 0n && tokenDetails?.address && (
                <div className="p-4 bg-gray-700/30 rounded-md border border-gray-600/50 text-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center">
                      <Coins className="w-4 h-4 mr-2 text-purple-400" />
                      Creation Fee:
                    </span>
                    <span className="font-medium text-gray-100">
                      {formatBalance(deckFee, tokenDecimals, 2)} {tokenSymbol}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center">
                      <Wallet className="w-4 h-4 mr-2 text-purple-400" />
                      Your Balance:
                    </span>
                    <span className={`font-medium ${hasSufficientFeeBalance ? 'text-gray-100' : 'text-red-400'}`}>
                      {isLoadingBalance ? '...' : formatBalance(balance, tokenDecimals, 4)} {tokenSymbol}
                    </span>
                  </div>

                  {!hasSufficientFeeBalance &&
                    <p className="text-xs text-red-400 text-center">Insufficient balance for fee.</p>
                  }

                  {needsFeeApproval && hasSufficientFeeBalance && (
                    <Button
                      onClick={handleApproveFee}
                      disabled={!canSubmitApproval}
                      variant="warning"
                      className="w-full !py-2.5 !text-sm mt-2"
                      loading={isLoadingApproval}
                    >
                      Approve Fee Payment
                    </Button>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!canSubmitCreation}
                  variant="primary"
                  className="w-full py-3 text-base font-medium"
                  loading={isLoadingCreation}
                >
                   {isLoadingCreation ? 'Deploying...' : 'Create Deck'}
                </Button>
              </div>

              {txState.message && (
                <p className={`text-sm text-center pt-2 font-medium ${
                  txState.status === 'error' ? 'text-red-400' :
                  txState.status === 'success' ? 'text-green-400' :
                  'text-blue-400'
                }`}>
                  {txState.message}
                </p>
              )}

              {approveFeeSimError && needsFeeApproval &&
                <p className="text-xs text-red-400 text-center mt-2">
                  Approval Error: {approveFeeSimError.shortMessage}
                </p>
              }

              {createDeckSimError && !needsFeeApproval &&
                <p className="text-xs text-red-400 text-center mt-2">
                  Creation Error: {createDeckSimError.shortMessage}
                </p>
              }
            </form>
          ) : (
             <div className="flex flex-col items-center justify-center h-full py-10">
              <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-3">Deck Created Successfully!</h2>
              <p className="text-gray-400 text-center mb-8 max-w-md">
                Your investment deck "{name}" is now live on the blockchain.
              </p>
              <div className="flex gap-4">
                <Link href="/decks">
                  <Button variant="primary" className="flex items-center">
                    View All Decks
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuccess(false);
                    setName('');
                    setDescription('');
                    setMinInvestmentStr('');
                    setTxState({ status: 'idle', message: null });
                  }}
                >
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Right Column - Visual (Animation or Status) */}
        {/* *** ADJUSTED CARD BACKGROUND FOR STARS *** */}
        <Card border={true} className="!bg-gradient-to-br from-gray-900 via-indigo-950 to-black border-gray-700/50 p-0 flex flex-col items-center justify-center min-h-[500px] lg:min-h-[600px] overflow-hidden relative group">
          {isSuccess ? (
             // --- Success State (Remains Unchanged) ---
            <div className="text-center space-y-4 p-6 z-10">
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-green-500/30">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Transaction Confirmed</h3>
              <p className="text-gray-300 max-w-md mx-auto">
                Deck "{name}" deployed successfully.
              </p>
            </div>
          ) : isLoadingCreation ? (
             // --- Loading State (Remains Unchanged) ---
             <div className="text-center space-y-6 p-6 z-10">
              <div className="relative w-28 h-28 mx-auto">
                 {/* Rotating Cubes Spinner */}
                 <div className="absolute inset-0 animate-spin-slow duration-3000">
                    <Square className="w-28 h-28 text-blue-500/50 opacity-50"/>
                 </div>
                 <div className="absolute inset-4 animate-spin-slow-reverse duration-4000">
                     <Square className="w-20 h-20 text-indigo-500/60 opacity-60"/>
                 </div>
                 <div className="absolute inset-8 animate-spin-slow duration-5000">
                     <Square className="w-12 h-12 text-purple-500/70 opacity-70"/>
                 </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white animate-pulse">Deploying Contract...</h3>
                <p className="text-gray-400 text-sm">Broadcasting transaction to the network.</p>
              </div>
            </div>
          ) : (
             // --- Default State - Show CRYSTAL FOLLOW Animation ---
            <>
             {/* Overlayed Text (Remains Unchanged) */}
             <div className="absolute inset-x-0 top-6 sm:top-8 text-center p-4 z-10 pointer-events-none">
                
              </div>
              {/* 3D Canvas - Full Card */}
              <div className="absolute inset-0 w-full h-full cursor-pointer">
                 <CrystalFollowAnimation />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// Remember to add animations to tailwind.config.js if needed
/*
module.exports = {
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-slow-reverse': 'spin 4s linear infinite reverse',
      }
    }
  }
}
*/