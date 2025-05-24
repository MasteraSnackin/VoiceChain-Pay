// src/app/actions.ts
'use server';

import { parseTransactionIntent, type ParseTransactionIntentInput, type ParseTransactionIntentOutput } from '@/ai/flows/parse-transaction-intent';
import { z } from 'zod';

// Define ParseTransactionIntentOutputSchema locally as it cannot be exported from a 'use server' file.
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
    .describe('The destination chain for cross-chain transfers, if specified.'),
  suzakuAction: z
    .string()
    .optional()
    .describe('The specific Suzaku DeFi action (swap, stake), if specified.'),
  token: z
    .string()
    .optional()
    .describe('The token to be used in the transaction, if specified.'),
});

// Define a schema for the output that includes a potential error
const SubmitVoiceCommandOutputSchema = z.union([
  ParseTransactionIntentOutputSchema,
  z.object({ error: z.string() })
]);

export type SubmitVoiceCommandOutput = z.infer<typeof SubmitVoiceCommandOutputSchema>;

export async function submitVoiceCommand(input: ParseTransactionIntentInput): Promise<SubmitVoiceCommandOutput> {
  try {
    // Validate input if necessary, though parseTransactionIntent already does
    const result = await parseTransactionIntent(input);
    return result;
  } catch (error) {
    console.error("Error parsing transaction intent:", error);
    // Ensure the error object matches the schema
    if (error instanceof Error) {
      return { error: error.message || "Failed to parse transaction intent due to an unknown error." };
    }
    return { error: "Failed to parse transaction intent due to an unknown error." };
  }
}

