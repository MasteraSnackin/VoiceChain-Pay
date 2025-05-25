
# VoiceChain Pay

VoiceChain Pay is a prototype platform demonstrating voice-activated cryptocurrency payments and DeFi interactions, primarily focused on the Avalanche ecosystem and exploring cross-chain capabilities. It leverages AI for natural language understanding and aims to provide a seamless, voice-first user experience for blockchain transactions.

- Video: https://www.youtube.com/watch?v=cnFY2yeKZiU
- Demo:

## ScreenShoots
![image](https://github.com/user-attachments/assets/ad67fb36-d425-442d-97b7-af4bd0c3b3d3)

![](https://github.com/MasteraSnackin/VoiceChain-Pay/blob/main/docs/Screenshot%202025-05-25%20074821.png)






## Cross-Chain Payment System Architecture 
![](https://github.com/MasteraSnackin/VoiceChain-Pay/blob/main/docs/2Screenshot%202025-05-25%20083200.png)

## Core Features

-   **Live Voice Command Interface:** Utilizes the browser's Web Speech API for real-time voice input, allowing users to initiate cryptocurrency payments and other blockchain interactions using simple voice commands (e.g., "Send 0.5 AVAX to Alice on Ethereum").

  
-   **AI-Powered Intent Recognition:** The application uses Genkit with Google's Gemini model to understand and parse natural language transaction requests. It extracts key details like intent (send, swap, stake), amount, recipient, token, destination chain, and infers recipient type (EOA or Smart Contract).

  
-   **Cross-Chain Protocol Suggestion:** Based on the parsed intent and destination chain, the AI suggests an appropriate protocol for the transaction (e.g., Same-Chain, Chainlink CCIP for EVM-compatible chains, Avalanche Teleporter for Avalanche Subnets).


## Sequence Diagram 
![](https://github.com/MasteraSnackin/VoiceChain-Pay/blob/main/docs/1Screenshot%202025-05-25%20082739.png)

  
-   **Secure Voice Authentication (Simulated):** A robust voice authentication flow is implemented to verify user identity before authorizing transactions. Currently, this involves hashing the voice transcript (captured via Web Speech API) as a proxy for true biometric voice hashing.


-   **Wallet Integration (MetaMask/Core):** Connects to the user's Web3 wallet (e.g., MetaMask, Core via `window.ethereum`) to fetch account details and balance (from Avalanche Fuji Testnet).


-   **Detailed Transaction Feedback:** Provides clear visual feedback on the status of the (simulated) transaction, including details specific to the type of transfer (same-chain or cross-chain) and the protocol used.


## Voice-Activted Blockchain Payment Flow 
![](https://github.com/MasteraSnackin/VoiceChain-Pay/blob/main/docs/2Screenshot%202025-05-25%20083040.png)



## Tech Stack

-   **Frontend:** Next.js (App Router), React, TypeScript
-   **UI Components:** Shadcn/ui
-   **Styling:** Tailwind CSS (with a unified dark purple/indigo gradient theme)
-   **AI/NLP:** Genkit (Google Gemini model via `@genkit-ai/googleai`)
-   **Voice Recognition:** Browser's Web Speech API
-   **State Management:** React Context, `useState`, `useReducer` (for `useToast`)
-   **Routing:** Next.js App Router
-   **Linting/Formatting:** ESLint, Prettier (implied by Next.js setup)
-   **Wallet Interaction:** Web3.js (for connecting to `window.ethereum` providers like MetaMask)
-   **Blockchain (Conceptual):**
    -   Avalanche (C-Chain, Subnets)
    -   Chainlink CCIP (for cross-chain to external EVM chains)
    -   Avalanche Teleporter (for cross-Avalanche Subnet communication)
-   **Hashing (Simulated Voice Auth):** `ethers.js` (`keccak256`)

## Architectural Flow

The application conceptualizes a voice-activated payment system with the following general flow, aligning with modern cross-chain architectures:

1.  **User & Voice Command:** The user issues a voice command to the frontend application.
2.  **Voice Processing & Transcription (Off-Chain - Client-Side Browser):**
    *   The browser's Web Speech API captures the user's speech and converts it into a text transcript in real-time.
3.  **Intent Interpretation (Off-Chain - Server-Side AI via Genkit):**
    *   The transcribed text is sent from the client to a Next.js Server Action, which then calls a Genkit AI flow (`parseTransactionIntent`).
    *   This server-side flow leverages an LLM (e.g., Google's Gemini model) to perform Natural Language Processing (NLP). It extracts structured data: intent, amount, recipient, token, destination chain, and recipient type (EOA/SmartContract).
    *   Crucially, it also suggests a `suggestedProtocol` (SameChain, CCIP, AvalancheTeleporter) based on the interpretation, understanding the nuances of the Avalanche ecosystem (C-Chain, Subnets) and external chains. This step prepares structured data that could be consumed by systems like Chainlink Functions for on-chain execution.
4.  **User Review & Wallet Connection:**
    *   The frontend displays the parsed intent to the user for review.
    *   The user connects their wallet (e.g., MetaMask) via the browser's Ethereum provider. Account details and balance are fetched from the Avalanche Fuji Testnet.
5.  **Voice Authentication:**
    *   The user authenticates via voice (biometric hashing of the voice transcript).
    *   A hash is generated by the `generateVoiceAuthHash` Genkit flow.
6.  **Transaction(Conceptual On-Chain Interaction):**
    *   Based on the authenticated intent and `suggestedProtocol`, the system showw the appropriate transaction path.
    *   **If Same-Chain (Avalanche C-Chain):** A direct transfer/interaction is implied.
    *   **If Cross-Chain (to external EVM via CCIP):** The system indicates the conceptual use of Chainlink CCIP. Chainlink Functions could be used to securely transmit the structured data from the AI to an on-chain contract, which then interacts with CCIP. CCIP's Risk Management Network is a key component for security.
    *   **If Cross-Chain (to Avalanche Subnet via Teleporter):** The system indicates the conceptual use of Avalanche Teleporter, leveraging Avalanche Warp Messaging (AWM) for secure and validated cross-subnet communication.
    *   The on-chain components (smart contracts, transaction finalization) are envisioned to operate on the **Avalanche blockchain**, leveraging its scalability, low finality times, and the customizability offered by Subnets.
7.  **Confirmation Feedback:** The user receives detailed feedback on the transaction success page, summarizing the transaction, including the protocol used and relevant security notes.

This flow emphasizes the off-chain voice processing and AI-driven interpretation feeding into a conceptual on-chain execution, capable of handling both same-chain and complex cross-chain scenarios.

## Voice-activated Payment System Architecture


![](https://github.com/MasteraSnackin/VoiceChain-Pay/blob/main/docs/2Screenshot%202025-05-25%20083004.png)



## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm or yarn
-   A Web3 wallet browser extension (e.g., MetaMask or Core) configured for the Avalanche Fuji Testnet.

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd voicechain-pay
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set Up Environment Variables:**
    Create a `.env` file in the root of the project and add your Google API key for Genkit:
    ```env
    GOOGLE_API_KEY="your_google_api_key_here"
    ```
    *Note: You can obtain a Google API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).*

### Running the Development Server

1.  **Start the Genkit Development Server (Optional but Recommended for AI flow debugging):**
    In one terminal, run:
    ```bash
    npm run genkit:dev
    # or for auto-reloading on changes
    npm run genkit:watch
    ```
    This starts the Genkit developer UI, typically on `http://localhost:4000`.

2.  **Start the Next.js Application:**
    In another terminal, run:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002` (or another port if 9002 is busy).

## Usage Guide

1.  **Navigate to the Application:** Open your browser to `http://localhost:9002`.
2.  **Initiate a Command:**
    *   Click the large microphone icon in the "Voice Command Center" to start recording. Your browser will likely ask for microphone permission.
    *   Speak your command (e.g., "Send 1 AVAX to Bob", "Pay 50 USDC to shop.avax on Ethereum", "Send 10 AVAX to Alice on DFK Subnet").
    *   Click the microphone icon again (now a stop icon) to stop recording, or wait for a pause in speech.
    *   Alternatively, click one of the "Try saying:" example buttons.
3.  **Review Parsed Intent:** The application will process your command using AI. The "Recognized Command" card will show your spoken phrase, and the "Parsed Transaction Intent" card will display the structured data extracted from your command.
4.  **Connect Wallet:** Click the "Connect Wallet" button. Your browser wallet (e.g., MetaMask) will prompt for connection. Ensure it's set to the Avalanche Fuji Testnet. Your address and balance will be displayed.
5.  **Proceed to Authentication:** If the intent is clear and the wallet is connected, the "Proceed to Voice Authentication" button will become active. Click it.
6.  **Voice Authentication:**
    *   On the "Voice Authentication" page, review the transaction details.
    *   Click "Start Authentication" and say the prompted passphrase (e.g., "My voice is my password").
    *   The system will  voice biometric verification.
7.  **Transaction Outcome:** Upon successful authentication, you'll be redirected to the "Transaction Details" page, which provides a summary of the transaction.

## Code Structure

```
.
├── .env
├── .vscode/
│   └── settings.json
├── apphosting.yaml
├── components.json
├── next.config.ts
├── package.json
├── README.md
├── readme2.md
├── src/
│   ├── ai/
│   │   ├── dev.ts
│   │   ├── flows/
│   │   │   ├── generate-voice-auth-hash.ts
│   │   │   └── parse-transaction-intent.ts
│   │   └── genkit.ts
│   ├── app/
│   │   ├── actions.ts
│   │   ├── auth/
│   │   │   └── voice/
│   │   │       └── page.tsx
│   │   ├── transaction/
│   │   │   └── success/
│   │   │       └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── tooltip.tsx
│   │   ├── intent-display.tsx
│   │   ├── transaction-feedback.tsx
│   │   └── wallet-connect.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   └── lib/
│       └── utils.ts
├── tailwind.config.ts
└── tsconfig.json
```




-   `src/app/page.tsx`: Main application page, handles voice input and initial intent display.
-   `src/app/auth/voice/page.tsx`: Voice authentication page.
-   `src/app/transaction/success/page.tsx`: Page displayed after successful transaction.
-   `src/ai/flows/`: Contains Genkit AI flows.
    -   `parse-transaction-intent.ts`: Parses natural language to structured transaction data.
    -   `generate-voice-auth-hash.ts`: voice biometric hash generation.
-   `src/ai/genkit.ts`: Genkit global instance configuration.
-   `src/app/actions.ts`: Next.js Server Actions that call Genkit flows.
-   `src/components/`: Reusable React components.
    -   `ui/`: Shadcn/ui components.
    -   `intent-display.tsx`: Displays parsed transaction intent.
    -   `wallet-connect.tsx`: Handles wallet connection and balance display.
    -   `transaction-feedback.tsx`: Displays transaction status messages.
-   `src/app/globals.css`: Global styles and Tailwind CSS theme configuration (dark purple/indigo gradient).
-   `src/hooks/`: Custom React hooks (e.g., `use-toast.ts`, `use-mobile.ts`).
-   `src/lib/utils.ts`: Utility functions (e.g., `cn` for Tailwind class merging).

## Styling Guidelines

This project follows a consistent styling approach for a cohesive user experience:

-   **Global Theme:** A unified dark, gradient-based theme (dark purples, indigos, vibrant blues) is applied across the application. Key HSL variables are defined in `src/app/globals.css`.
-   **Tailwind CSS:** The project extensively utilizes Tailwind CSS for rapid and consistent styling. Utility classes are preferred.
-   **Shadcn/ui:** Components from the `shadcn/ui` library are used for pre-built, accessible, and themeable UI elements.
-   **Custom Components:** Custom components are created in `src/components` and styled using Tailwind CSS classes or by extending `shadcn/ui` components, adhering to the global theme.
-   **Responsive Design:** The application is designed to be responsive and functional on various screen sizes.
-   **Layout:** Pages generally maintain a consistent layout structure, often centered, using Flexbox or Grid for arrangement. Cards use a semi-transparent, blurred background effect.

## Known Limitations & Prototype Nature

-   **Voice Biometrics:** The voice authentication feature currently hashes the *transcript* of the spoken phrase, not the actual voice data. True voice biometric authentication is more complex and would require capturing and processing raw audio.
-   **Speech Recognition API:** Relies on the browser's Web Speech API, which may have varying support and accuracy across different browsers and platforms. Microphone access is required.
-   **Error Handling:** While some error handling is in place, a production application would require more comprehensive error management and user feedback for various scenarios (network issues, API failures, contract errors, etc.).

## Future Enhancements

-   Integration with real voice biometric services for secure authentication.
-   Implementation of actual transaction signing and sending to Avalanche smart contracts.
-   Deployment of smart contracts on Avalanche testnet/mainnet for payment and DeFi logic.
-   Live integration with Chainlink Functions for secure off-chain to on-chain data delivery.
-   Support for a wider range of voice commands, DeFi interactions (e.g., detailed staking, swapping logic), and tokens.
-   Streaming AI responses for a more interactive feel during intent parsing.
-   User accounts and persistent storage for preferences or aliases.
-   Enhanced UI/UX based on user testing and feedback.
-   More robust error handling and user guidance.
