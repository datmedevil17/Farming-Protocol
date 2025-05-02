"use client";

import { useState, useEffect, useMemo } from "react";
import { useReadContract, useReadContracts, useAccount } from "wagmi";
import DeckCard from "@/components/DeckCard";
import { mapContractDataToDeck, fetchPlatformTokenDetails } from "@/lib/utils";
import {
  investmentDeckManagerAddress,
  investmentDeckManagerABI,
} from "@/lib/contracts";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

const DeckFilters = ({ currentFilter, onFilterChange }) => (
  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
    <span className="text-sm text-gray-400 mr-1">Filter:</span>
    {["all", "active", "inactive"].map((status) => (
      <button
        key={status}
        onClick={() => onFilterChange(status)}
        className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${
          currentFilter === status
            ? "bg-purple-600 text-white font-medium shadow-sm"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        {" "}
        {status}{" "}
      </button>
    ))}
  </div>
);
const DeckSearch = ({ searchTerm, onSearchChange }) => (
  <div className="relative w-full sm:w-auto sm:min-w-[250px]">
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
    <Input
      type="search"
      placeholder="Search decks by name or ID..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="!pl-9 !py-2 text-sm"
    />
  </div>
);

export default function DecksListPage() {
  const { chain } = useAccount();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [tokenDetails, setTokenDetails] = useState(null);
  const [deckInfoContracts, setDeckInfoContracts] = useState([]);
  useEffect(() => {
    if (chain?.id) {
      fetchPlatformTokenDetails(chain.id).then(setTokenDetails);
    }
  }, [chain?.id]);

  const { data: deckCountData, isLoading: isLoadingCount } = useReadContract({
    address: investmentDeckManagerAddress,
    abi: investmentDeckManagerABI,
    functionName: "getDeckCount",
    chainId: chain?.id,
    query: { enabled: !!chain?.id && !!investmentDeckManagerAddress },
  });

  useEffect(() => {
    if (
      deckCountData !== undefined &&
      deckCountData !== null &&
      tokenDetails &&
      chain?.id &&
      investmentDeckManagerAddress
    ) {
      const count = Number(deckCountData);
      console.log(`Preparing to fetch info for ${count} decks...`);
      const contractsToRead = Array.from({ length: count }, (_, i) => ({
        address: investmentDeckManagerAddress,
        abi: investmentDeckManagerABI,
        functionName: "getDeckInfo",
        args: [i],
        chainId: chain.id,
      }));
      setDeckInfoContracts(contractsToRead);
    } else {
      setDeckInfoContracts([]);
    }
  }, [deckCountData, chain?.id, tokenDetails]);

  const {
    data: allDecksRawData,
    isLoading: isLoadingDecks,
    error,
    refetch,
  } = useReadContracts({
    contracts: deckInfoContracts,
    query: {
      enabled: deckInfoContracts.length > 0 && !!tokenDetails,
      select: (results) =>
        results
          .map((res, index) =>
            res.status === "success"
              ? mapContractDataToDeck(res.result, index, tokenDetails)
              : null
          )
          .filter(Boolean),
    },
  });
  const allDecks = allDecksRawData || [];

  const displayedDecks = useMemo(() => {
    let result = allDecks;
    if (filterStatus !== "all") {
      result = result.filter((deck) => deck.status === filterStatus);
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (lowerSearchTerm) {
      result = result.filter(
        (deck) =>
          deck.name?.toLowerCase().includes(lowerSearchTerm) ||
          deck.id?.toString().includes(lowerSearchTerm) ||
          deck.description?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return result;
  }, [allDecks, filterStatus, searchTerm]);
  const isLoading = isLoadingCount || isLoadingDecks || !tokenDetails;

  if (!investmentDeckManagerAddress) {
    return (
      <Card className="text-center">
        <p className="text-red-400">Platform contract address not set.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
        Investment Decks
      </h1>
      <Card className="!bg-gray-800/80" padding="p-4">
        {" "}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {" "}
          <DeckFilters
            currentFilter={filterStatus}
            onFilterChange={setFilterStatus}
          />{" "}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {" "}
            <DeckSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />{" "}
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="secondary"
              small
              className="flex-shrink-0"
            >
              {" "}
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>{" "}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </Card>
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <DeckCard key={`loading-${i}`} isLoading={true} />
          ))}
        </div>
      )}
      {error && (
        <Card className="text-center">
          <p className="text-red-400">
            Error loading decks: {error.shortMessage || error.message}
          </p>
        </Card>
      )}
      {!isLoading && !error && displayedDecks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayedDecks.map(
            (deck) => deck && <DeckCard key={deck.id} deck={deck} />
          )}
        </div>
      )}
      {!isLoading && !error && displayedDecks.length === 0 && (
        <Card className="text-center">
          <p className="text-gray-500 py-10">
            {allDecks.length > 0
              ? "No decks match your criteria."
              : "No decks found on the platform yet."}
          </p>
        </Card>
      )}
    </div>
  );
}
