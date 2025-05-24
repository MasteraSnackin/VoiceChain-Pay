
// src/ai/flows/parse-transaction-intent.ts
'use server';

/**
 * @fileOverview Parses user voice commands to extract transaction intent, amount, recipient address, recipient type, and suggest cross-chain protocols.
 *
 * - parseTransactionIntent - A function that parses the transaction intent from voice commands.
 * - ParseTransactionIntentInput - The input type for the parseTransactionIntent function.
 * - ParseTransactionIntentOutput - The return type for the parseTransactionIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseTransactionIntentInputSchema = z.object({
  voiceCommand: z
    .string()
    .describe('The voice command spoken by the user, e.g., \"send 1 AVAX to Bob on Ethereum\"'),
});
export type ParseTransactionIntentInput = z.infer<typeof ParseTransactionIntentInputSchema>;

// This schema is now defined and exported from src/app/actions.ts
// We still need the type for the flow's internal return.
// This internal schema includes recipientType which might be handled/defaulted in the flow
const FlowOutputSchema = z.object({
  intent: z
    .enum(['send', 'swap', 'stake', 'unknown'])
    .describe('The identified transaction intent.'),
  amount: z.number().optional().describe('The amount to be transacted, if specified.'),
  recipientAddress: z
    .string()
    .optional()
    .describe('The recipient blockchain address or alias, if specified.'),
  recipientType: z
    .enum(['EOA', 'SmartContract', 'Unknown'])
    .optional()
    .describe("The type of recipient: 'EOA' for simple transfers to user wallets, 'SmartContract' for interactions like staking or swapping, or 'Unknown' if ambiguous."),
  destinationChain: z
    .string()
    .optional()
    .describe('The destination chain for cross-chain transfers, if specified (e.g., "Ethereum", "Polygon", "Avalanche Subnet X").'),
  token: z
    .string()
    .optional()
    .describe('The token to be used in the transaction, if specified (e.g., "AVAX", "USDC").'),
  suggestedProtocol: z
    .enum(['CCIP', 'AvalancheTeleporter', 'SameChain'])
    .optional()
    .describe('The suggested cross-chain protocol. "CCIP" for non-Avalanche chains, "AvalancheTeleporter" for other Avalanche Subnets, "SameChain" for primary Avalanche C-Chain or if no destination chain is specified. These protocols incorporate security measures like risk management for secure transfers.'),
  suzakuAction: z
    .string()
    .optional()
    .describe('The specific Suzaku DeFi action (swap, stake), if specified.'),
});
export type ParseTransactionIntentOutput = z.infer<typeof FlowOutputSchema>;


export async function parseTransactionIntent(input: ParseTransactionIntentInput): Promise<ParseTransactionIntentOutput> {
  return parseTransactionIntentFlow(input);
}

const parseTransactionIntentPrompt = ai.definePrompt({
  name: 'parseTransactionIntentPrompt',
  input: {schema: ParseTransactionIntentInputSchema},
  output: {schema: FlowOutputSchema}, // Use internal FlowOutputSchema
  prompt: `You are an AI assistant that interprets voice commands to determine the user's transaction intent. Your goal is to extract structured data that could then be used by other systems (like Chainlink Functions or an Avalanche smart contract containing payment logic) to facilitate a transaction. Focus on Avalanche blockchain transactions, but also handle cross-chain intents. Use your knowledge of common blockchain terms, token symbols, network names, and DeFi protocols to make the best possible interpretation.

  Analyze the following voice command: "{{{voiceCommand}}}"

  Extract the following information:
  1.  'intent': The core action (e.g., 'send', 'swap', 'stake'). If unclear, set to 'unknown'.
  2.  'amount': The numerical amount for the transaction.
  3.  'recipientAddress': The target address or alias.
  4.  'recipientType': Determine if the recipient is an Externally Owned Account (EOA) or a Smart Contract.
      - If the command implies interaction with a DeFi protocol (e.g., 'stake AVAX on Suzaku', 'swap USDC for JOE', 'add liquidity to a pool on Trader Joe'), set 'recipientType' to 'SmartContract'.
      - If it's a direct transfer to an address or alias (e.g., 'send 10 AVAX to Bob', 'pay coffee-shop.avax'), set 'recipientType' to 'EOA'.
      - If ambiguous or not specified, set 'recipientType' to 'Unknown'.
  5.  'token': The cryptocurrency or token involved (e.g., AVAX, USDC).
  6.  'destinationChain': If the user specifies a destination network different from the primary Avalanche C-Chain (e.g., "Ethereum", "Polygon", "BSC", "Avalanche DFK Subnet", "Arbitrum").
  7.  'suggestedProtocol':
      - If 'destinationChain' is specified and implies a non-Avalanche network (e.g., 'Ethereum', 'Polygon', 'Solana', 'BSC', 'Arbitrum', 'Optimism'), set 'suggestedProtocol' to 'CCIP'.
      - If 'destinationChain' is specified and implies another Avalanche Subnet (e.g., 'Avalanche DFK Subnet', 'Avax Subnet X', 'Beam Subnet'), set 'suggestedProtocol' to 'AvalancheTeleporter'.
      - If no 'destinationChain' is specified, or if it clearly refers to the primary Avalanche C-Chain (e.g. "Avalanche", "Avax C-Chain"), set 'suggestedProtocol' to 'SameChain'.
      - Note: When suggesting 'CCIP' or 'AvalancheTeleporter', understand these protocols are designed for secure cross-chain transfers and often incorporate risk management and validation mechanisms.
  8.  'suzakuAction': If the command mentions a specific DeFi action like 'swap' or 'stake' in a specific context (e.g., within a dApp named Suzaku), note it. Otherwise, omit.

  Output the information in JSON format. If a field is not present or applicable, it can be omitted or set to null where appropriate according to the schema.
  Focus on accurate extraction based on the command provided. Assume "Avalanche C-Chain" as the source chain if not otherwise specified for cross-chain scenarios.
`,
});

const parseTransactionIntentFlow = ai.defineFlow(
  {
    name: 'parseTransactionIntentFlow',
    inputSchema: ParseTransactionIntentInputSchema,
    outputSchema: FlowOutputSchema, // Use internal FlowOutputSchema
  },
  async input => {
    const {output} = await parseTransactionIntentPrompt(input);

    if (output) {
        // Fallback for suggestedProtocol
        if (output.destinationChain && !output.suggestedProtocol) {
            const destChainLower = output.destinationChain.toLowerCase();
            if (destChainLower.includes('ethereum') || destChainLower.includes('polygon') || destChainLower.includes('bsc') || destChainLower.includes('solana')  || destChainLower.includes('arbitrum') || destChainLower.includes('optimism')) {
                output.suggestedProtocol = 'CCIP';
            } else if (destChainLower.includes('subnet') || destChainLower.includes('dfk') || destChainLower.includes('beam')) {
                output.suggestedProtocol = 'AvalancheTeleporter';
            } else {
                 output.suggestedProtocol = 'SameChain';
            }
        } else if (!output.destinationChain && !output.suggestedProtocol) {
            output.suggestedProtocol = 'SameChain';
        }

        // Fallback for recipientType
        if (!output.recipientType) {
            output.recipientType = 'Unknown';
        }
    }
    return output!;
  }
);
// Do NOT export ParseTransactionIntentOutputSchema from here
// export { ParseTransactionIntentOutputSchema };
