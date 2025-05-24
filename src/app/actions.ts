// src/app/actions.ts
'use server';

import { parseTransactionIntent, type ParseTransactionIntentInput, type ParseTransactionIntentOutput as FlowOutputType } from '@/ai/flows/parse-transaction-intent';
import { z } from 'zod';

// Define ParseTransactionIntentOutputSchema directly in this file
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
  suzakuAction: z
    .string()
    .optional()
    .describe('The specific Suzaku DeFi action (swap, stake), if specified.'),
});

// Use the locally defined schema for the output type
export type ParseTransactionIntentOutput = z.infer<typeof ParseTransactionIntentOutputSchema>;

// Define a schema for the output that includes a potential error
const SubmitVoiceCommandOutputSchema = z.union([
  ParseTransactionIntentOutputSchema, // Use the locally defined schema
  z.object({ error: z.string() })
]);

export type SubmitVoiceCommandOutput = z.infer<typeof SubmitVoiceCommandOutputSchema>;

export async function submitVoiceCommand(input: ParseTransactionIntentInput): Promise<SubmitVoiceCommandOutput> {
  try {
    // The flow returns FlowOutputType, which should be compatible with ParseTransactionIntentOutput
    const result: FlowOutputType = await parseTransactionIntent(input);
    // We can cast here if necessary, but Zod inference should align if schemas are identical
    return result as ParseTransactionIntentOutput;
  } catch (error) {
    console.error("Error parsing transaction intent:", error);
    if (error instanceof Error) {
      return { error: error.message || "Failed to parse transaction intent due to an unknown error." };
    }
    return { error: "Failed to parse transaction intent due to an unknown error." };
  }
}
