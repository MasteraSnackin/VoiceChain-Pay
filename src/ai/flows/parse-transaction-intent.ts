// src/ai/flows/parse-transaction-intent.ts
'use server';

/**
 * @fileOverview Parses user voice commands to extract transaction intent, amount, and recipient address.
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
    .describe('The voice command spoken by the user, e.g., \"send 1 AVAX to Bob\"'),
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

export type ParseTransactionIntentOutput = z.infer<typeof ParseTransactionIntentOutputSchema>;

export async function parseTransactionIntent(input: ParseTransactionIntentInput): Promise<ParseTransactionIntentOutput> {
  return parseTransactionIntentFlow(input);
}

const parseTransactionIntentPrompt = ai.definePrompt({
  name: 'parseTransactionIntentPrompt',
  input: {schema: ParseTransactionIntentInputSchema},
  output: {schema: ParseTransactionIntentOutputSchema},
  prompt: `You are an AI assistant that parses voice commands to determine the user's transaction intent on the Avalanche blockchain.

  Analyze the following voice command and extract the transaction intent, amount, recipient address, destination chain (if applicable), Suzaku DeFi action (if applicable) and token (if applicable).

  Voice Command: {{{voiceCommand}}}

  Output the information in JSON format.

  If the intent is unclear or cannot be determined, set the intent to \"unknown\". If certain fields are not present in the voice command, set them to null.
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
    return output!;
  }
);

