// lib/contracts.js

// --- LIVE CONTRACT DETAILS (FOR ROOTSTOCK Mainnet/Testnet) ---

// === Addresses updated based on user input ===

// 1. Investment Platform Contract

export const investmentDeckManagerAddress = '0xEd1DAe049e0a49f6B7a42f84e22350278662cFd5'; // <<< UPDATED ADDRESS
export const investmentDeckManagerABI = [ // <<< InvestmentPlatform ABI (as provided before)
	{ inputs: [{ internalType: "address payable", name: "_tokenAddress", type: "address" }, { internalType: "address", name: "initialOwner", type: "address" }], stateMutability: "nonpayable", type: "constructor" },
	{ inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "OwnableInvalidOwner", type: "error" },
	{ inputs: [{ internalType: "address", name: "account", type: "address" }], name: "OwnableUnauthorizedAccount", type: "error" },
	{ anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "deckId", type: "uint256" }, { indexed: true, internalType: "address", name: "creator", type: "address" }, { indexed: false, internalType: "string", name: "name", type: "string" }], name: "DeckCreated", type: "event" },
	{ anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "deckId", type: "uint256" }, { indexed: false, internalType: "bool", name: "isActive", type: "bool" }], name: "DeckStatusChanged", type: "event" },
	{ anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "deckId", type: "uint256" }, { indexed: true, internalType: "address", name: "investor", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "InvestmentMade", type: "event" },
	{ anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "previousOwner", type: "address" }, { indexed: true, internalType: "address", name: "newOwner", type: "address" }], name: "OwnershipTransferred", type: "event" },
	{ anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "deckId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "ProfitAdded", type: "event" },
	{ anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "deckId", type: "uint256" }, { indexed: true, internalType: "address", name: "investor", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "ProfitWithdrawn", type: "event" },
	{ inputs: [{ internalType: "uint256", name: "_deckId", type: "uint256" }, { internalType: "uint256", name: "_amount", type: "uint256" }], name: "addProfit", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [{ internalType: "string", name: "_name", type: "string" }, { internalType: "string", name: "_description", type: "string" }, { internalType: "uint256", name: "_minInvestment", type: "uint256" }], name: "createDeck", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [], name: "deckCreationFee", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "", type: "uint256" }], name: "decks", outputs: [{ internalType: "address", name: "creator", type: "address" }, { internalType: "string", name: "name", type: "string" }, { internalType: "string", name: "description", type: "string" }, { internalType: "uint256", name: "totalInvestment", type: "uint256" }, { internalType: "uint256", name: "profitGenerated", type: "uint256" }, { internalType: "uint256", name: "minInvestment", type: "uint256" }, { internalType: "uint256", name: "creationTime", type: "uint256" }, { internalType: "bool", name: "isActive", type: "bool" }, { internalType: "uint256", name: "investors", type: "uint256" }], stateMutability: "view", type: "function" },
	{ inputs: [], name: "getDeckCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "_deckId", type: "uint256" }], name: "getDeckInfo", outputs: [{ internalType: "address", name: "creator", type: "address" }, { internalType: "string", name: "name", type: "string" }, { internalType: "string", name: "description", type: "string" }, { internalType: "uint256", name: "totalInvestment", type: "uint256" }, { internalType: "uint256", name: "profitGenerated", type: "uint256" }, { internalType: "uint256", name: "minInvestment", type: "uint256" }, { internalType: "uint256", name: "creationTime", type: "uint256" }, { internalType: "bool", name: "isActive", type: "bool" }, { internalType: "uint256", name: "investors", type: "uint256" }], stateMutability: "view", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "_deckId", type: "uint256" }, { internalType: "address", name: "_investor", type: "address" }], name: "getInvestmentInfo", outputs: [{ internalType: "uint256", name: "amount", type: "uint256" }, { internalType: "uint256", name: "timeInvested", type: "uint256" }, { internalType: "bool", name: "hasWithdrawn", type: "bool" }], stateMutability: "view", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "_deckId", type: "uint256" }, { internalType: "uint256", name: "_amount", type: "uint256" }], name: "invest", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "address", name: "", type: "address" }], name: "investments", outputs: [{ internalType: "uint256", name: "amount", type: "uint256" }, { internalType: "uint256", name: "timeInvested", type: "uint256" }, { internalType: "bool", name: "hasWithdrawn", type: "bool" }], stateMutability: "view", type: "function" },
	{ inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
	{ inputs: [], name: "platformFeePercent", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
	{ inputs: [], name: "platformToken", outputs: [{ internalType: "contract PlatformToken", name: "", type: "address" }], stateMutability: "view", type: "function" },
	{ inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "_fee", type: "uint256" }], name: "setDeckCreationFee", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "_feePercent", type: "uint256" }], name: "setPlatformFeePercent", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "_deckId", type: "uint256" }], name: "toggleDeckStatus", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [{ internalType: "address", name: "newOwner", type: "address" }], name: "transferOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
	{ inputs: [{ internalType: "uint256", name: "_deckId", type: "uint256" }], name: "withdrawProfit", outputs: [], stateMutability: "nonpayable", type: "function" }
];

// 2. Platform Token Contract

export const platformTokenAddress = '0xc4eD4Bd20F0Ac61f4e3e1dE64547c84955ad6d60'; // <<< UPDATED ADDRESS
export const platformTokenABI = [ // <<< Full PlatformToken ABI (as provided before)
	{ inputs: [], name: "name", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "decimals", outputs: [{ internalType: "uint8", name: "", type: "uint8" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "totalSupply", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ internalType: "address", name: "account", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ internalType: "address", name: "owner", type: "address" }, { internalType: "address", name: "spender", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ internalType: "address", name: "to", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "transfer", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ internalType: "address", name: "from", type: "address" }, { internalType: "address", name: "to", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "transferFrom", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "burn", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ internalType: "address", name: "account", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "burnFrom", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [{ internalType: "address", name: "newOwner", type: "address" }], name: "transferOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [], name: "tokenPrice", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ internalType: "address", name: "initialOwner", type: "address" }], stateMutability: "nonpayable", type: "constructor" },
    { inputs: [{ internalType: "address", name: "to", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [], name: "buyTokens", outputs: [], stateMutability: "payable", type: "function" },
    { inputs: [{ internalType: "uint256", name: "newPrice", type: "uint256" }], name: "setTokenPrice", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [], name: "withdrawETH", outputs: [], stateMutability: "nonpayable", type: "function" },
    { stateMutability: "payable", type: "receive" },
    { anonymous: false, inputs: [ { indexed: true, internalType: "address", name: "owner", type: "address" }, { indexed: true, internalType: "address", name: "spender", type: "address" }, { indexed: false, internalType: "uint256", name: "value", type: "uint256" } ], name: "Approval", type: "event" },
    { anonymous: false, inputs: [ { indexed: true, internalType: "address", name: "from", type: "address" }, { indexed: true, internalType: "address", name: "to", type: "address" }, { indexed: false, internalType: "uint256", name: "value", type: "uint256" } ], name: "Transfer", type: "event" },
    { anonymous: false, inputs: [ { indexed: true, internalType: "address", name: "previousOwner", type: "address", }, { indexed: true, internalType: "address", name: "newOwner", type: "address" } ], name: "OwnershipTransferred", type: "event" },
    { anonymous: false, inputs: [ { indexed: true, internalType: "address", name: "buyer", type: "address" }, { indexed: false, internalType: "uint256", name: "amountOfETH", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amountOfTokens", type: "uint256" } ], name: "TokensPurchased", type: "event" },
    { inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "OwnableInvalidOwner", type: "error" },
	{ inputs: [{ internalType: "address", name: "account", type: "address" }], name: "OwnableUnauthorizedAccount", type: "error" },
];

// 3. Standard ERC20 ABI Snippet (used for approval, same as platform token)
export const erc20ABI = platformTokenABI;