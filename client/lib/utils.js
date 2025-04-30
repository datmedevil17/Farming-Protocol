// lib/utils.js
import { formatUnits, isAddress } from 'viem';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from './wagmi';
import { investmentDeckManagerAddress, investmentDeckManagerABI, platformTokenABI as erc20TokenABI, platformTokenAddress as hardcodedPlatformTokenAddress } from './contracts'; // Use hardcoded as ultimate fallback

/** Shortens a blockchain address */
export const shortenAddress = (address, startLength = 6, endLength = 4) => {
    if (!address || typeof address !== 'string' || !isAddress(address) || address.length < startLength + endLength + 2) { return address || ''; }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/** Formats a BigInt balance value using token decimals */
export const formatBalance = (value, decimals = 18, precision = 4) => {
     if (value === undefined || value === null || decimals === undefined || decimals === null) { return (0).toFixed(precision); } try { const valueBigInt = typeof value === 'bigint' ? value : BigInt(value); const formatted = formatUnits(valueBigInt, Number(decimals)); const num = parseFloat(formatted); if (isNaN(num)) return (0).toFixed(precision); let effectivePrecision = precision; if (num !== 0 && Math.abs(num) < 1) { effectivePrecision = Math.max(precision, 4); } else if (Math.abs(num) >= 1000) { effectivePrecision = Math.min(precision, 2); } return num.toLocaleString(undefined, { minimumFractionDigits: effectivePrecision, maximumFractionDigits: effectivePrecision }); } catch (error) { console.error("Error formatting balance:", error, { value, decimals }); return (0).toFixed(precision); }
};

// --- Function to fetch Platform Token details ---
let cachedTokenDetails = {}; // Cache per chainId

// ---> Added 'export' KEYWORD HERE <---
export async function fetchPlatformTokenDetails(chainId) {
    if (cachedTokenDetails[chainId]) {
        // console.log("Using cached token details for chain:", chainId);
        return cachedTokenDetails[chainId];
    }
    console.log("Fetching platform token details for chain:", chainId);
    try {
        if (!investmentDeckManagerAddress) throw new Error("Investment manager address not set in contracts.js");

        const tokenAddressResult = await readContract(wagmiConfig, {
            address: investmentDeckManagerAddress,
            abi: investmentDeckManagerABI,
            functionName: 'platformToken',
            chainId: chainId,
        });

        const tokenAddress = tokenAddressResult;

        if (!tokenAddress || !isAddress(tokenAddress)) {
             console.error("Invalid/missing token address from platformToken():", tokenAddress, ". Falling back.");
             throw new Error("Dynamic token address fetch failed.");
        }
        console.log("Dynamically fetched platform token address:", tokenAddress);
        const details = await fetchTokenInfo(tokenAddress, chainId);
        cachedTokenDetails[chainId] = details; // Cache result per chainId
        return details;

    } catch (error) {
        console.warn(`Error fetching platform token dynamically (${error.message}). Falling back to hardcoded address if available.`);
        if (hardcodedPlatformTokenAddress && isAddress(hardcodedPlatformTokenAddress)) {
            try {
                const details = await fetchTokenInfo(hardcodedPlatformTokenAddress, chainId);
                cachedTokenDetails[chainId] = details;
                console.log("Using hardcoded platform token details:", cachedTokenDetails[chainId]);
                return details;
            } catch (fallbackError) {
                 console.error("Error fetching hardcoded platform token details:", fallbackError);
            }
        }
        console.error("Could not determine platform token details.");
        return { address: undefined, symbol: 'TOKEN', decimals: 18 }; // Absolute fallback
    }
}

// Helper to fetch Symbol/Decimals for a given token address
async function fetchTokenInfo(tokenAddress, chainId) {
     console.log(`Fetching symbol/decimals for ${tokenAddress} on chain ${chainId}`);
     // Use the correct hardcoded address based on your active network (e.g., Sepolia)
     const theCorrectHardcodedAddress = hardcodedPlatformTokenAddress;

     let knownSymbol = null;
     let knownDecimals = null;

     // Check if it's our specific platform token that might be missing functions
     if (theCorrectHardcodedAddress && tokenAddress?.toLowerCase() === theCorrectHardcodedAddress?.toLowerCase()) {
         console.warn(`Address ${tokenAddress} matches known PlatformToken. Check if symbol/decimals needed.`);
         // *** IF your specific token ALSO lacks symbol/decimals, HARDCODE known values here: ***
         // knownSymbol = 'YOUR_TOKEN_SYMBOL'; // e.g., 'MYTKN'
         // knownDecimals = 18;             // e.g., 18, 6 etc.
     }

     try {
         const [symbolResult, decimalsResult] = await Promise.all([
             knownSymbol !== null ? Promise.resolve(knownSymbol) : readContract(wagmiConfig, { address: tokenAddress, abi: erc20TokenABI, functionName: 'symbol', chainId: chainId, }),
             knownDecimals !== null ? Promise.resolve(knownDecimals) : readContract(wagmiConfig, { address: tokenAddress, abi: erc20TokenABI, functionName: 'decimals', chainId: chainId, })
         ]);
         const symbol = symbolResult;
         const decimals = decimalsResult;
         console.log(`Fetched symbol: ${symbol}, decimals: ${decimals} for ${tokenAddress}`);
         return { address: tokenAddress, symbol: symbol || 'TOKEN', decimals: decimals !== undefined && decimals !== null ? Number(decimals) : 18, };
     } catch(err) {
         console.error(`Error in fetchTokenInfo for ${tokenAddress}:`, err);
         return { address: tokenAddress, symbol: knownSymbol || 'ERROR', decimals: knownDecimals !== null ? knownDecimals : 18, };
     }
}

// --- Mapping Functions ---

/** Maps data from the `getDeckInfo` contract call */
export const mapContractDataToDeck = (contractData, deckId, tokenDetails) => {
    if (!contractData || !Array.isArray(contractData) || contractData.length < 8) { console.warn("mapContractDataToDeck received invalid data for ID:", deckId, contractData); return null; }
    try {
        const [ creator, name, description, totalInvestment, profitGenerated, minInvestment, creationTime, isActive, investorsCount ] = contractData;
        let estimatedAPY = undefined;
        const totalInvNum = Number(formatUnits(BigInt(totalInvestment || 0), tokenDetails?.decimals ?? 18));
        const profitNum = Number(formatUnits(BigInt(profitGenerated || 0), tokenDetails?.decimals ?? 18));
        if (totalInvNum > 0 && profitNum > 0) { estimatedAPY = (profitNum / totalInvNum) * 100; } // Very basic APY
        return {
            id: Number(deckId), address: `deck-${deckId}`, creator: creator, name: name || 'Unnamed Deck', description: description || 'No description.',
            totalInvestment: BigInt(totalInvestment || 0), profitGenerated: BigInt(profitGenerated || 0), minInvestment: BigInt(minInvestment || 0),
            creationTime: Number(creationTime || 0), status: isActive ? 'active' : 'inactive', investorsCount: Number(investorsCount || 0),
            token: tokenDetails?.address, tokenSymbol: tokenDetails?.symbol || '?', tokenDecimals: tokenDetails?.decimals ?? 18,
            riskLevel: 'Medium', currentAPY: estimatedAPY, strategy: undefined,
        };
    } catch (error) { console.error("Error mapping single deck data for ID", deckId, ":", error, contractData); return null; }
};

/** Maps data from the `getInvestmentInfo` contract call */
export const mapContractDataToInvestment = (contractData, deckInfo) => {
     if (!contractData || !Array.isArray(contractData) || contractData.length < 3 || !deckInfo) { console.warn("mapContractDataToInvestment received invalid data:", {contractData, deckInfo}); return null; }
    try {
         const [amount, timeInvested, hasWithdrawn] = contractData;
         const investedAmount = BigInt(amount || 0);
         const currentValue = investedAmount; // Simplification
         const profitOrLoss = 0n; // Simplification
        return {
            deckId: deckInfo.id, deckName: deckInfo.name, amountInvested: investedAmount, currentValue: currentValue, profitOrLoss: profitOrLoss,
            tokenSymbol: deckInfo.tokenSymbol, tokenDecimals: deckInfo.tokenDecimals, timeInvested: Number(timeInvested || 0), hasWithdrawnProfit: hasWithdrawn,
            shares: undefined,
        };
    } catch (error) { console.error("Error mapping investment data for deck", deckInfo?.id, ":", error, contractData); return null; }
};