
# VoiceChain Pay

VoiceChain Pay is a prototype platform demonstrating voice-activated cryptocurrency payments and DeFi interactions, primarily focused on the Avalanche ecosystem and exploring cross-chain capabilities.

## Core Features

- **Voice-Activated Payment Initiation:** Users can initiate cryptocurrency payments using simple voice commands.
- **AI-Powered Intent Recognition:** The application uses AI (via Genkit and Google's Gemini model) to understand and parse natural language transaction requests, extracting key details like amount, recipient, token, and destination chain.
- **Cross-Chain Protocol Suggestion:** Based on the parsed intent, the AI suggests an appropriate protocol for the transaction (e.g., Same-Chain, Chainlink CCIP for EVM-compatible chains, Avalanche Teleporter for Avalanche Subnets).
- **Secure Voice Authentication:** A robust voice authentication flow (simulated biometric hashing) is implemented to verify user identity before authorizing transactions.
- **Wallet Connection:** Mock integration with cryptocurrency wallets for transaction processing simulation.
- **Transaction Feedback:** Provides clear feedback to the user on the status of their (simulated) transaction, including details specific to the type of transfer (same-chain or cross-chain).

## Architectural Flow

The application generally follows this flow:
1.  **Voice Command:** The user issues a voice command (e.g., "Send 10 AVAX to John on Ethereum").
2.  **Voice Processing (Off-Chain):**
    *   The browser's Speech Recognition API converts speech to text.
    *   A Genkit AI flow processes this text for NLP, extracting structured transaction intent (amount, recipient, token, destination chain, etc.).
3.  **User Review & Wallet Connection:** The user reviews the parsed intent and connects their wallet (simulated).
4.  **Voice Authentication:** The user authenticates via voice biometrics (simulated).
5.  **Transaction Simulation:**
    *   Based on the intent (e.g., same-chain or cross-chain), the system simulates the appropriate transaction path.
    *   For cross-chain, it indicates the use of protocols like Chainlink CCIP or Avalanche Teleporter.
6.  **Confirmation Feedback:** The user receives detailed feedback on the success page about the (simulated) transaction.

This flow mirrors a system where off-chain components handle voice processing and intent interpretation, which then feeds into on-chain (or cross-chain protocol) actions.

## Style Guidelines

This project follows a consistent styling approach to ensure a clean and user-friendly interface.

- **Tailwind CSS:** The project utilizes Tailwind CSS for rapid and consistent styling. Utility classes are preferred for common styles.
- **Shadcn/ui:** Components from the `shadcn/ui` library are used for pre-built, accessible UI elements.
- **Custom Components:** Custom components are created in `src/components` and styled using Tailwind CSS classes or by extending `shadcn/ui` components.
- **Consistent Layout:** Pages maintain a consistent layout structure using Flexbox or Grid for arrangement. The application uses a dark, gradient-based theme for an immersive experience.
- **Responsive Design:** The application is designed to be responsive and work well on different screen sizes.
- **Color Palette:** A defined color palette (dark purples, blues, and vibrant accents) is used throughout the application for consistency, managed through CSS variables in `src/app/globals.css`.

## Next Steps

To get started with VoiceChain Pay:

1.  **Clone the Repository:** Clone this repository to your local machine.
2.  **Install Dependencies:** Navigate to the project directory and install dependencies using `npm install` or `yarn install`.
3.  **Configure Environment Variables:** If using actual Genkit AI services requiring API keys, set them up in a `.env` file (e.g., `GOOGLE_API_KEY`). Refer to Genkit documentation for specifics.
4.  **Run the Development Server:** Start the development server using `npm run dev`.
5.  **Explore the Code:**
    *   Main application logic: `src/app/page.tsx`
    *   Voice authentication: `src/app/auth/voice/page.tsx`
    *   Transaction success display: `src/app/transaction/success/page.tsx`
    *   AI flows: `src/ai/flows/` (e.g., `parse-transaction-intent.ts`)
    *   Core components: `src/components/`
6.  **Test the Flow:** Use voice commands or the example buttons to initiate a transaction, connect the mock wallet, and proceed through voice authentication to see the simulated transaction outcome.

For more detailed information on specific features or implementation details, please refer to the `docs/blueprint.md` file.
