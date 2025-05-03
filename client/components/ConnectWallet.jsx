"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { mainnet, sepolia } from "wagmi/chains"; // Import chains for check
import {
  fetchPlatformTokenDetails,
  shortenAddress,
  formatBalance,
} from "@/lib/utils";
import Button from "./ui/Button";

export default function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [tokenDetails, setTokenDetails] = useState({
    address: undefined,
    symbol: "TOKEN",
    decimals: 18,
  });
  const [isFetchingToken, setIsFetchingToken] = useState(false);

  useEffect(() => {
    if (chain?.id) {
      setIsFetchingToken(true);
      setTokenDetails({ address: undefined, symbol: "...", decimals: 18 });
      fetchPlatformTokenDetails(chain.id)
        .then((details) => setTokenDetails(details))
        .catch((err) => {
          console.error("Failed to fetch token details in ConnectWallet:", err);
          setTokenDetails({
            address: undefined,
            symbol: "ERROR",
            decimals: 18,
          });
        })
        .finally(() => setIsFetchingToken(false));
    } else {
      setTokenDetails({ address: undefined, symbol: "TOKEN", decimals: 18 });
    }
  }, [chain?.id]);

  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address: address,
    token: tokenDetails?.address,
    chainId: chain?.id,
    query: {
      enabled: isConnected && !!address && !!chain && !!tokenDetails?.address,
      refetchInterval: 20000,
    },
  });

  const handleConnect = () => {
    connect({ connector: injected()});
  };

  const displayBalance = formatBalance(
    balanceData?.value,
    tokenDetails?.decimals,
    2
  );
  const displaySymbol = isFetchingToken ? "..." : tokenDetails?.symbol || "";
  const getChainColor = (id) => {
    if (id === mainnet.id) return "#627eea";
    if (id === sepolia.id) return "#ffc107";
    return "#ef4444";
  };
  const chainColor = getChainColor(chain?.id);
  const chainDisplayName =
    chain?.id === sepolia.id ? "Sepolia" : chain?.name || "Unsupported";
  const explorerUrl = chain?.blockExplorers?.default?.url;

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-1.5 sm:space-x-2 bg-gray-700/60 p-1 sm:p-1.5 rounded-full shadow-inner">
        {tokenDetails?.address && (
          <div
            className="text-xs sm:text-sm font-medium bg-gray-800/80 px-2 py-1 rounded-full whitespace-nowrap hidden sm:block"
            title={
              balanceData
                ? `${formatBalance(
                    balanceData.value,
                    tokenDetails.decimals,
                    6
                  )} ${displaySymbol}`
                : "Token balance"
            }
          >
            {" "}
            {isLoadingBalance || isFetchingToken
              ? "..."
              : `${displayBalance}`}{" "}
            <span className="ml-1 text-gray-400">{displaySymbol}</span>{" "}
          </div>
        )}
        <div className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full bg-gray-800/80 flex items-center space-x-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: chainColor }}
            title={`Connected to ${chainDisplayName}`}
          ></span>
          <a
            href={explorerUrl ? `${explorerUrl}/address/${address}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-300 transition-colors truncate"
            title={`${address}\nChain: ${chainDisplayName}`}
          >
            {" "}
            {shortenAddress(address, 4, 4)}{" "}
          </a>
        </div>
        <Button
          onClick={() => disconnect()}
          variant="secondary"
          small
          className="!rounded-full !p-1.5 sm:!p-2 !bg-gray-600/80 hover:!bg-red-500/50 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
        </Button>
      </div>
    );
  }
  return (
    <Button
      onClick={handleConnect}
      variant="primary"
      loading={isConnecting}
      disabled={isConnecting}
    >
      {" "}
      {isConnecting ? "Connecting..." : "Connect Wallet"}{" "}
    </Button>
  );
}
