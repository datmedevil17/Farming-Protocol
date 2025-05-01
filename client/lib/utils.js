// lib/utils.js
import { formatUnits, isAddress } from 'viem';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from './wagmi';
import {
    investmentDeckManagerAddress,
    investmentDeckManagerABI,
    platformTokenABI as erc20TokenABI,
    platformTokenAddress as hardcodedPlatformTokenAddress // Keep for potential fallback logic ONLY
} from './contracts'; // Use the UPDATED addresses

/** Shortens a blockchain address */
export const shortenAddress = (address, startLength = 6, endLength = 4) => { if (!address || typeof address !== 'string' || !isAddress(address) || address.length < startLength + endLength + 2) { return address || ''; } return `${address.slice(0, startLength)}...${address.slice(-endLength)}`; };

/** Formats a BigInt balance value using token decimals */
export const formatBalance = (value, decimals = 18, precision = 4) => { if (value === undefined || value === null || decimals === undefined || decimals === null) { return (0).toFixed(precision); } try { const valueBigInt = typeof value === 'bigint' ? value : BigInt(value); const formatted = formatUnits(valueBigInt, Number(decimals)); const num = parseFloat(formatted); if (isNaN(num)) return (0).toFixed(precision); let effectivePrecision = precision; if (num !== 0 && Math.abs(num) < 1) { effectivePrecision = Math.max(precision, 4); } else if (Math.abs(num) >= 1000) { effectivePrecision = Math.min(precision, 2); } return num.toLocaleString(undefined, { minimumFractionDigits: effectivePrecision, maximumFractionDigits: effectivePrecision }); } catch (error) { console.error("Error formatting balance:", error, { value, decimals }); return (0).toFixed(precision); } };

// --- Function to fetch Platform Token details ---
let cachedTokenDetails = {};

// Helper function (not exported directly)
async function fetchTokenInfo(tokenAddress, chainId) {
     console.log(`Fetching symbol/decimals for ${tokenAddress} on chain ${chainId}`);
     // const theCorrectHardcodedAddress = hardcodedPlatformTokenAddress; // No longer needed for primary logic

     // --- HARDCODE CHECK REMOVED / COMMENTED OUT ---
     // let knownSymbol = null;
     // let knownDecimals = null;
     // if (theCorrectHardcodedAddress && tokenAddress?.toLowerCase() === theCorrectHardcodedAddress?.toLowerCase()) {
     //     console.warn(`Address ${tokenAddress} matches PlatformToken. Using hardcoded symbol & decimals.`);
     //     knownSymbol = 'PTK';
     //     knownDecimals = 18;
     // }
     // if (knownSymbol !== null && knownDecimals !== null) {
     //     console.log(`Using hardcoded values: Symbol=${knownSymbol}, Decimals=${knownDecimals}`);
     //     return { address: tokenAddress, symbol: knownSymbol, decimals: knownDecimals };
     // }
     // --- END HARDCODE CHECK REMOVAL ---

     // --- Always attempt to read from contract ---
     console.log(`Attempting contract read for ${tokenAddress}...`);
     try {
         const [symbolResult, decimalsResult] = await Promise.all([
             readContract(wagmiConfig, { address: tokenAddress, abi: erc20TokenABI, functionName: 'symbol', chainId: chainId, }),
             readContract(wagmiConfig, { address: tokenAddress, abi: erc20TokenABI, functionName: 'decimals', chainId: chainId, })
         ]);

         const symbol = symbolResult;
         const decimals = decimalsResult;

         // Use fallbacks ONLY if the read results are actually empty/null/undefined
         const finalSymbol = symbol || 'TOKEN';
         const finalDecimals = (decimals !== undefined && decimals !== null) ? Number(decimals) : 18;

         console.log(`Contract read results: Symbol=${symbol}, Decimals=${decimals}. Using: Symbol=${finalSymbol}, Decimals=${finalDecimals}`);
         return { address: tokenAddress, symbol: finalSymbol, decimals: finalDecimals };

     } catch(err) {
         console.error(`Error in fetchTokenInfo contract read for ${tokenAddress}:`, err);
         // If reading fails, return ERROR/defaults
         return { address: tokenAddress, symbol: 'ERROR', decimals: 18 };
     }
}

// Exported function to get token details, handles caching and fallbacks
export async function fetchPlatformTokenDetails(chainId) {
    if (!chainId) { console.error("fetchPlatformTokenDetails no chainId"); return { address: undefined, symbol: 'TOKEN', decimals: 18 }; }
    if (cachedTokenDetails[chainId]) { return cachedTokenDetails[chainId]; }
    console.log("Fetching platform token details for chain:", chainId);
    try {
        // Check if the *new* manager address is set
        if (!investmentDeckManagerAddress || !isAddress(investmentDeckManagerAddress)) {
            throw new Error("Investment manager address is not configured or invalid");
        }
        const tokenAddressResult = await readContract(wagmiConfig, { address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'platformToken', chainId: chainId });
        const tokenAddress = tokenAddressResult;
        if (!tokenAddress || !isAddress(tokenAddress)) { console.error("Invalid token address from platformToken():", tokenAddress, ". Fallback."); throw new Error("Dynamic fetch failed."); }
        console.log("Dynamic platform token addr:", tokenAddress);
        const details = await fetchTokenInfo(tokenAddress, chainId); // Calls the updated fetchTokenInfo
        cachedTokenDetails[chainId] = details;
        return details;
    } catch (error) {
        console.warn(`Dynamic fetch failed (${error.message}). Fallback.`);
        // Use the *new* hardcoded address for fallback check
        if (hardcodedPlatformTokenAddress && isAddress(hardcodedPlatformTokenAddress)) {
            try { const details = await fetchTokenInfo(hardcodedPlatformTokenAddress, chainId); cachedTokenDetails[chainId] = details; console.log("Using hardcoded token details:", details); return details; } catch (fallbackError) { console.error("Error fetching hardcoded token details:", fallbackError); }
        }
        console.error("Could not determine token details."); return { address: undefined, symbol: 'TOKEN', decimals: 18 };
    }
}

// --- Mapping Functions (No changes needed, they use the results) ---
export const mapContractDataToDeck = (contractData, deckId, tokenDetails) => { /* ... keep existing ... */ if (!contractData || !Array.isArray(contractData) || contractData.length < 8) { console.warn("mapContractDataToDeck invalid data:", deckId, contractData); return null; } try { const [ creator, name, description, totalInvestment, profitGenerated, minInvestment, creationTime, isActive, investorsCount ] = contractData; let estimatedAPY = undefined; const tokenDecimalsForCalc = tokenDetails?.decimals ?? 18; try { const totalInvNum = Number(formatUnits(BigInt(totalInvestment || 0), tokenDecimalsForCalc)); const profitNum = Number(formatUnits(BigInt(profitGenerated || 0), tokenDecimalsForCalc)); if (totalInvNum > 0 && profitNum > 0) { estimatedAPY = (profitNum / totalInvNum) * 100; } } catch (calcError) { console.error("Error calculating APY:", deckId, calcError); } return { id: Number(deckId), address: `deck-${deckId}`, creator: creator, name: name || 'Unnamed Deck', description: description || 'No description.', totalInvestment: BigInt(totalInvestment || 0), profitGenerated: BigInt(profitGenerated || 0), minInvestment: BigInt(minInvestment || 0), creationTime: Number(creationTime || 0), status: isActive ? 'active' : 'inactive', investorsCount: Number(investorsCount || 0), token: tokenDetails?.address, tokenSymbol: tokenDetails?.symbol || '?', tokenDecimals: tokenDetails?.decimals ?? 18, riskLevel: 'Medium', currentAPY: estimatedAPY, strategy: undefined, }; } catch (error) { console.error("Error mapping deck data:", deckId, error, contractData); return null; } };
export const mapContractDataToInvestment = (contractData, deckInfo) => { /* ... keep existing ... */ if (!contractData || !Array.isArray(contractData) || contractData.length < 3 || !deckInfo) { console.warn("mapContractDataToInvestment invalid data:", {contractData, deckInfo}); return null; } try { const [amount, timeInvested, hasWithdrawn] = contractData; const investedAmount = BigInt(amount || 0); const currentValue = investedAmount; const profitOrLoss = 0n; return { deckId: deckInfo.id, deckName: deckInfo.name, amountInvested: investedAmount, currentValue: currentValue, profitOrLoss: profitOrLoss, tokenSymbol: deckInfo.tokenSymbol, tokenDecimals: deckInfo.tokenDecimals, timeInvested: Number(timeInvested || 0), hasWithdrawnProfit: hasWithdrawn, shares: undefined, }; } catch (error) { console.error("Error mapping investment data:", deckInfo?.id, error, contractData); return null; } };