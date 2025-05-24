// src/ai/flows/parse-transaction-intent.ts
'use server';

/**
 * @fileOverview Parses user voice commands to extract transaction intent, amount, recipient address, and suggest cross-chain protocols.
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

const ParseTransactionIntentOutputSchema = z.object({
  intent: z
    .enum(['send', 'swap', 'stake', 'unknown'])
    .describe('The identified transaction intent.'),
  amount: z.number().optional().describe('The amount to be transacted, if specified.'),
  recipientAddress: z
    .string()
    .optional()
    .describe('The recipient blockchain address or alias, if specified.'),
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
    .describe('The suggested cross-chain protocol. "CCIP" for non-Avalanche chains, "AvalancheTeleporter" for other Avalanche Subnets, "SameChain" for primary Avalanche C-Chain or if no destination chain is specified.'),
  suzakuAction: z // Retained from previous version, not directly from diagram but part of app logic
    .string()
    .optional()
    .describe('The specific Suzaku DeFi action (swap, stake), if specified.'),
});

export type ParseTransactionIntentOutput = z.infer<typeof ParseTransactionIntentOutputSchema>;


export async function parseTransactionIntent(input: ParseTransactionIntentInput): Promise<ParseTransactionIntentOutput> {
  return parseTransactionIntentFlow(input);
}

const parseTransactionIntentPrompt = ai.definePrompt({
  name: 'parseTransactionIntentPrompt',
  input: {schema: ParseTransactionIntentInputSchema},
  output: {schema: ParseTransactionIntentOutputSchema},
  prompt: `You are an AI assistant that parses voice commands to determine the user's transaction intent, primarily on the Avalanche blockchain, but with capability for cross-chain transactions.

  Analyze the following voice command: "{{{voiceCommand}}}"

  Extract the following information:
  1.  'intent': The core action (e.g., 'send', 'swap', 'stake'). If unclear, set to 'unknown'.
  2.  'amount': The numerical amount for the transaction.
  3.  'recipientAddress': The target address or alias.
  4.  'token': The cryptocurrency or token involved (e.g., AVAX, USDC).
  5.  'destinationChain': If the user specifies a destination network different from the primary Avalanche C-Chain (e.g., "Ethereum", "Polygon", "BSC", "Avalanche DFK Subnet", "Arbitrum").
  6.  'suggestedProtocol':
      - If 'destinationChain' is specified and implies a non-Avalanche network (e.g., 'Ethereum', 'Polygon', 'Solana', 'BSC', 'Arbitrum', 'Optimism'), set 'suggestedProtocol' to 'CCIP'.
      - If 'destinationChain' is specified and implies another Avalanche Subnet (e.g., 'Avalanche DFK Subnet', 'Avax Subnet X', 'Beam Subnet'), set 'suggestedProtocol' to 'AvalancheTeleporter'.
      - If no 'destinationChain' is specified, or if it clearly refers to the primary Avalanche C-Chain (e.g. "Avalanche", "Avax C-Chain"), set 'suggestedProtocol' to 'SameChain'.
  7.  'suzakuAction': If the command mentions a specific DeFi action like 'swap' or 'stake' in a specific context (e.g., within a dApp named Suzaku), note it. Otherwise, omit.


  Output the information in JSON format. If a field is not present or applicable, it can be omitted or set to null where appropriate according to the schema.
  Focus on accurate extraction based on the command provided. Assume "Avalanche C-Chain" as the source chain if not otherwise specified for cross-chain scenarios.
`,
});

const parseTransactionIntentFlow = ai.defineFlow(
  {
    name: 'parseTransactionIntentFlow',
    inputSchema: ParseTransactionIntentInputSchema,
    outputSchema: ParseTransactionIntentOutputSchema,
  },
  async input => {
    const {output} = await parseTransactionIntentPrompt(input);
    // Ensure suggestedProtocol is set if destinationChain is present but protocol wasn't explicitly determined by LLM according to new rules.
    // This is a fallback, ideally the LLM handles it.
    if (output?.destinationChain && !output.suggestedProtocol) {
        const destChainLower = output.destinationChain.toLowerCase();
        if (destChainLower.includes('ethereum') || destChainLower.includes('polygon') || destChainLower.includes('bsc') || destChainLower.includes('solana')  || destChainLower.includes('arbitrum') || destChainLower.includes('optimism')) {
            output.suggestedProtocol = 'CCIP';
        } else if (destChainLower.includes('subnet') || destChainLower.includes('dfk') || destChainLower.includes('beam')) {
            output.suggestedProtocol = 'AvalancheTeleporter';
        } else {
             output.suggestedProtocol = 'SameChain';
        }
    } else if (!output?.destinationChain && !output?.suggestedProtocol) {
        output.suggestedProtocol = 'SameChain';
    }
    return output!;
  }
);

// Removed export of ParseTransactionIntentOutputSchema
// export { ParseTransactionIntentOutputSchema };
