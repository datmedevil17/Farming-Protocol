# RootInvest (Rootstock Testnet DApp)

A web application for discovering, investing in, and managing cryptocurrency investment strategies ("Decks") built on the blockchain. This version is currently configured to interact with the **Sepolia testnet**. Users connect their crypto wallet (like Metamask) to interact with the platform.

## Core Features

-   **Dashboard:** Overview of your platform token balance and investment summary.
-   **Decks List:** Browse, filter, and search available investment decks.
-   **Deck Detail:** View complete information about a specific deck, its stats, and invest using the platform token.
-   **Portfolio:** Track your active investments and withdraw profits earned.
-   **Create Deck:** Interface to create new investment decks on the platform (requires paying a fee in the platform token and approval).
-   **Buy Token:** Interface to purchase the platform's native token using Sepolia ETH.

## Tech Stack

-   **Frontend:** Next.js (App Router), React
-   **Styling:** Tailwind CSS
-   **Blockchain Interaction:** `wagmi`, `viem`