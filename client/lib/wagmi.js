// lib/wagmi.js

import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { WagmiProvider, cookieStorage, createStorage } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Wagmi Config ---
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) { console.error("ERROR: NEXT_PUBLIC_PROJECT_ID environment variable is not set!"); }

export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet], // Primary: Sepolia
  projectId: projectId || 'fallback_project_id',
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL), // Use ENV var or default http()
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
    // Fallback if ENV VARs aren't set (ensure http() is imported if used)
    // [sepolia.id]: http(),
    // [mainnet.id]: http(),
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