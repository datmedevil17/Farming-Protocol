// lib/wagmi.js

import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem'; // Use defineChain for Rootstock
import { WagmiProvider, cookieStorage, createStorage } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Define Rootstock Chains ---
export const rootstock = defineChain({
  id: 30,
  name: 'Rootstock',
  nativeCurrency: { name: 'Rootstock Bitcoin', symbol: 'RBTC', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ROOTSTOCK_MAINNET_RPC || 'https://public-node.rsk.co'] },
  },
  blockExplorers: {
    default: { name: 'RSK Explorer', url: 'https://explorer.rsk.co' },
  },
});

export const rootstockTestnet = defineChain({
  id: 31,
  name: 'RSK Testnet',
  nativeCurrency: { name: 'Testnet Rootstock Bitcoin', symbol: 'tRBTC', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ROOTSTOCK_TESTNET_RPC || 'https://public-node.testnet.rsk.co'] },
  },
  blockExplorers: {
    default: { name: 'RSK Testnet Explorer', url: 'https://explorer.testnet.rsk.co' },
  },
  testnet: true,
});


// --- Wagmi Config ---
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) { console.error("ERROR: NEXT_PUBLIC_PROJECT_ID environment variable is not set!"); }

export const wagmiConfig = createConfig({
  // --- Use Rootstock Chains ---
  chains: [rootstock, rootstockTestnet],
  projectId: projectId || 'fallback_project_id',
  transports: {
    // --- Add transport for Rootstock ---
    [rootstock.id]: http(process.env.NEXT_PUBLIC_ROOTSTOCK_MAINNET_RPC), // Use ENV var or default http()
    [rootstockTestnet.id]: http(process.env.NEXT_PUBLIC_ROOTSTOCK_TESTNET_RPC),
    // Fallback if ENV VARs aren't set
    // [rootstock.id]: http(),
    // [rootstockTestnet.id]: http(),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

const queryClient = new QueryClient();

// Provider component
export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
         {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}