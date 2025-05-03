# RootInvest - Defi on RootStock


Welcome to **RootInvest**, a decentralized application (dApp) empowering users to interact with diverse cryptocurrency investment strategies directly on the secure **Rootstock network**. Connect your wallet (like Metamask) to explore a marketplace of "Decks" – curated investment strategies created by the community or the platform.

This platform allows you to browse various investment approaches, from yield farming to growth token baskets, all within the Rootstock ecosystem which leverages Bitcoin's security. Invest using the platform's native token (PTK), track your portfolio's performance, withdraw profits, and even create your own Decks for others to join. An integrated AI provides snapshot overviews of deck statistics to offer additional perspective.

## ▶ Demo Video

Click the thumbnail below to watch a walkthrough of RootInvest:

[![RootInvest Demo Video Thumbnail](https://github.com/user-attachments/assets/0bee60d3-1e88-4da1-9ad6-c1b1895b4347)](https://youtu.be/kpFY0i-Czyo)




## Table of Contents

- [Core Features](#core-features)  
- [Tech Stack](#tech-stack)  
- [UI Components](#ui-components)  
- [Deploy Link](#deploy-link)  
- [Contributors](#contributors)  



## Core Features

- *Dashboard*  
  Overview of your platform token balance and investment summary.  
- *Decks List*  
  Browse, filter, and search available investment decks.  
- *Deck Detail*  
  View stats & details of a deck and invest using the platform token.  
- *Portfolio*  
  Track active investments and withdraw profits.  
- *Create Deck*  
  Build new investment strategies (fee & approval required).  
- *Buy Token*  
  Swap RTBTC for the platform’s native token in-app.



## Tech Stack

- *Frontend:* Next.js (App Router), React  
- *Styling:* Tailwind CSS  
- *Blockchain Integration:* wagmi, viem  



## UI Components

### 1. Landing Page  
A clean welcome screen prompting users to connect their wallet and start exploring.  

![Landing Page](https://github.com/user-attachments/assets/62744b53-527c-4642-8162-e557102ef9d9)

### 2. Dashboard  
User control panel showing balances, usage stats, and quick navigation.  

![Dashboard](https://github.com/user-attachments/assets/5e1c70da-df65-4ba3-a442-5bdc0e7bddad)

### 3. Decks List  
Searchable grid/list of all on-chain decks, with key metrics (returns, risk, entry cost).  

![Decks List](https://github.com/user-attachments/assets/0f6b1017-0eae-4591-b5d4-4fa028399ccf)

### 4. Portfolio  
Personal summary of invested decks, profits, and withdrawal options.  

![Portfolio](https://github.com/user-attachments/assets/0b8228e7-bf42-44ae-9634-53f1b22f789b)

### 5. Deck Creation  
Form-based UI to define strategy parameters, pay creation fee, and submit for approval. 

![Create Deck](https://github.com/user-attachments/assets/ce71d1bb-47ed-4978-8886-1106489459b5)

### 6. Buy Token  

In-app swap interface to buy the platform’s token with RTBTC.  

![Buy Token](https://github.com/user-attachments/assets/8d593556-c935-47b2-aa5e-575b40546442)



## 🤖 AI’s View on Investment in Decks  

Visualization of how our AI model evaluates deck performance and suggests portfolio allocations.  

![AI View](https://github.com/user-attachments/assets/ec8d404f-596f-4b95-b90c-e9145df568be)




## 🛠️ Our AI-Assisted Development Journey for RootInvest

Here’s a look at how different AI models contributed to bringing RootInvest to life, along with  of the kinds of prompts we used.

### 1. Initial UI/UX Design & Scaffolding with `v0.dev` (Vercel AI)

For the initial visual direction and layout of our core pages, we turned to `v0.dev`. It was fantastic for quickly iterating on design ideas and getting a foundational structure.

*   **Pages Prototyped:** Landing Page, Dashboard, Decks List, Portfolio, Create Deck, and Buy Token pages.
*   **Our Approach:** We provided descriptive prompts focusing on the desired feel, key elements, and overall user flow.

    *   **Prompt (for the Landing Page):**
        ```json
        {
          "ai_tool": "v0.dev",
          "page_request": "Landing Page for RootInvest",
          "description": "Create a modern, clean, and inviting landing page for a DeFi investment platform called 'RootInvest' on the Rootstock network. It needs a prominent headline, a brief explanation of what RootInvest offers (investing in community-created 'Decks' of crypto assets), a clear 'Connect Wallet' call-to-action button, and maybe a subtle background graphic hinting at blockchain or finance. Emphasize security and ease of use. Use a color palette that inspires trust, maybe blues and greens."
        }
        ```
    *   **Prompt (for the Decks List Page):**
        ```json
        {
          "ai_tool": "v0.dev",
          "page_request": "Decks List Page for RootInvest",
          "description": "Design a page to display a list/grid of 'Investment Decks'. Each deck card should show: Deck Name, a short description or strategy type, Total Value Locked (TVL), recent APY/return, and a 'View Details' button. Include search and filter options at the top (e.g., filter by risk, sort by TVL). Keep it clean and easy to scan. Use Tailwind CSS for styling."
        }
        ```
    *   **Why this worked:** `v0.dev` excels with descriptive visual prompts. By clearly stating the page's purpose, key components, and desired aesthetic (as per effective prompt principles like "Define Your Goal Clearly" and "Be Specific and Descriptive"), we got solid starting points for our UI.

### 2. Smart Contract Development & Refinement with `Claude` (Anthropic)

Our smart contracts, `InvestmentDeckManager` and `PlatformToken`, are the backbone of RootInvest. For generating, analyzing, and refining Solidity code, we primarily utilized `Claude`. 

*   **Key Tasks:** Drafting core functions, ensuring security best practices, writing payable functions, and managing state variables related to decks and investments.


    *   **Prompt (for `InvestmentDeckManager`'s `invest` function):**
        ```json
        {
          "ai_tool": "Claude",
          "task": "Draft 'invest' function for InvestmentDeckManager",
          "context": "I'm working on a Solidity smart contract, 'InvestmentDeckManager', for the Rootstock network. It interacts with a PlatformToken (PTK, an RRC20 token). Here's a snippet of its intended ABI structure (or relevant parts of the `investmentDeckManagerABI` focusing on `decks`, `investments` mapping, `platformToken` address, and the `InvestmentMade` event).",
          "request": "Please write the `invest(uint256 _deckId, uint256 _amount)` function. It should: 1. Require `_amount` to be greater than the deck's `minInvestment`. 2. Require the deck `_deckId` to be active. 3. Transfer `_amount` of PTK from `msg.sender` to this contract. 4. Update the `totalInvestment` for the deck. 5. Update the `investments` mapping for the `msg.sender` and `_deckId`. 6. Increment the `investors` count for the deck if it's a new investor. 7. Emit an `InvestmentMade` event. Assume helper functions/mappings like `decks[_deckId].isActive`, `decks[_deckId].minInvestment`, and `platformToken.transferFrom()` are available and correct. Use Solidity ^0.8.x."
        }
        ```
    *   **Prompt (for `PlatformToken`'s `buyTokens` function):**
        ```json
        {
          "ai_tool": "Claude",
          "task": "Review and refine 'buyTokens' payable function for PlatformToken",
          "context": "Here's the `PlatformToken.sol` contract (or its ABI, specifically showing `tokenPrice`, `mint`, and `TokensPurchased` event). The `buyTokens()` function needs to be `payable`.",
          "request": "Review the following `buyTokens()` function. It should allow users to send rBTC (native Rootstock currency) and receive PTK tokens based on a `tokenPrice` (PTK per rBTC). 1. Calculate tokens to mint based on `msg.value` and `tokenPrice`. 2. Ensure `msg.value` is not zero. 3. Mint the calculated PTK tokens to `msg.sender`. 4. Emit a `TokensPurchased` event. Are there any security considerations I'm missing, like reentrancy or handling zero token price? What's the best way to handle potential rounding issues with integer division for token calculation?"
        }
        ```
    *   **Why this worked:** Providing `Claude` with specific context and breaking down the requirements into "Step-by-Step Instructions" helped generate accurate and relevant Solidity code. Asking for reviews also leveraged its analytical capabilities.

### 3. Further Development & Component Logic with `Gemini 1.5 Pro Preview`

Once we had initial designs and core contracts, `Gemini 2.5 Pro Preview` was instrumental in developing more complex frontend components, integrating blockchain interactions with `wagmi` and `viem`, and refining the application logic.

*   **Key Tasks:** Building React components for dynamic data display (e.g., Portfolio, Deck Details), implementing `wagmi` hooks for contract reads/writes, and structuring state management.
*   **Our Approach:** We used `Gemini` for more in-depth code generation, often providing it with existing component structures or `wagmi` patterns.

    *   **Prompt (for Portfolio component data fetching):**
        ```json
        {
          "ai_tool": "Gemini 2.5 Pro Preview",
          "task": "Develop React component logic for user's invested decks",
          "context": "I'm using Next.js, Tailwind CSS, wagmi, and viem. I have the `investmentDeckManagerABI` and `platformTokenABI`. The user is connected via wagmi's `useAccount` hook.",
          "request": "Create a React functional component `UserPortfolio.tsx`. It needs to: 1. Get the connected user's address. 2. Fetch all deck IDs the user has invested in (this might involve iterating or a dedicated contract function if available – assume I have a way to get a list of deck IDs, or `getInvestmentInfo` can be queried for many decks). 3. For each invested deck, use `wagmi`'s `useReadContract` to call `getDeckInfo` and `getInvestmentInfo` from `InvestmentDeckManager` to display: Deck Name, Amount Invested, Current Profit (you'll need to explain how profit is calculated or if it's directly available), and a 'Withdraw Profit' button. 4. The 'Withdraw Profit' button should trigger a `useWriteContract` call to `withdrawProfit(_deckId)`. Show loading states and handle potential errors gracefully. Structure the data fetching and display logic clearly."
        }
        ```
    *   **Why this worked:** `Gemini`'s ability to handle larger contexts and generate more complex code blocks was useful here. Being specific about the tech stack ("Be Specific and Descriptive") and the desired data flow ("Define Your Goal Clearly") was key.

### 4. Brainstorming, Content & Ideas with `ChatGPT`

For broader ideation, drafting initial text content for the UI, README sections (like this one!), and exploring different ways to explain DeFi concepts to users, `ChatGPT` was our go-to.

*   **Key Tasks:** Generating feature names, writing descriptive text for UI elements, drafting explanations for complex concepts, and outlining content.
*   **Our Approach:** We used `ChatGPT` more conversationally, asking for ideas, lists, or drafts, and then refining its output.

    *   **Prompt (for Deck creation UI tooltips):**
        ```json
        {
          "ai_tool": "ChatGPT",
          "task": "Generate tooltip text for 'Create Deck' form fields",
          "context": "In RootInvest, users can create their own 'Investment Decks'. The creation form has fields like 'Deck Name', 'Description', 'Minimum Investment (PTK)', 'Strategy Type (e.g., Yield Farming, Growth Tokens, Balanced)'.",
          "request": "For each of these fields, provide short, helpful tooltip text (1-2 sentences max). The tone should be encouraging and clear for someone new to creating investment strategies. For 'Minimum Investment', explain why it's important. For 'Strategy Type', briefly explain what each type generally implies."
        }
        ```
    *   **Why this worked:** `ChatGPT` excels at creative text generation and summarization. Setting the "Tone and Audience" helped get user-friendly content.



We critically reviewed, tested, and adapted all generated code and content to ensure it met our quality, security, and usability standards for RootInvest. Iteration on prompts was common – if the first output wasn't quite right, we'd refine the prompt with more context or clearer constraints.


## Deploy Link

Live demo: [click here](https://farming-protocol.vercel.app/)



## Contributors

- *[bansal-ishaan](https://github.com/bansal-ishaan)*
- *[Rohan-droid7341](https://github.com/Rohan-droid7341)*
- *[Sanjana-chennu](https://github.com/Sanjana-chennu)*
- *[Kaustubh-1-7](https://github.com/Kaustubh-1-7)*



