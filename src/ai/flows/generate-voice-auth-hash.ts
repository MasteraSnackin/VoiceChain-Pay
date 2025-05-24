// src/ai/flows/generate-voice-auth-hash.ts
'use server';

/**
 * @fileOverview Flow for generating a voice authentication hash from a voice sample.
 *
 * - generateVoiceAuthHash - A function that generates the voice authentication hash.
 * - GenerateVoiceAuthHashInput - The input type for the generateVoiceAuthHash function.
 * - GenerateVoiceAuthHashOutput - The return type for the generateVoiceAuthHash function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { keccak256 } from 'ethers';

const GenerateVoiceAuthHashInputSchema = z.object({
  voiceSampleDataUri: z
    .string()
    .describe(
      "A voice sample as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVoiceAuthHashInput = z.infer<typeof GenerateVoiceAuthHashInputSchema>;

const GenerateVoiceAuthHashOutputSchema = z.object({
  voiceAuthHash: z.string().describe('The keccak256 hash of the voice sample.'),
});
export type GenerateVoiceAuthHashOutput = z.infer<typeof GenerateVoiceAuthHashOutputSchema>;

export async function generateVoiceAuthHash(input: GenerateVoiceAuthHashInput): Promise<GenerateVoiceAuthHashOutput> {
  return generateVoiceAuthHashFlow(input);
}

const generateVoiceAuthHashFlow = ai.defineFlow(
  {
    name: 'generateVoiceAuthHashFlow',
    inputSchema: GenerateVoiceAuthHashInputSchema,
    outputSchema: GenerateVoiceAuthHashOutputSchema,
  },
  async input => {
    const {voiceSampleDataUri} = input;

    // Remove the data URI prefix to get the raw base64 encoded data
    const base64VoiceData = voiceSampleDataUri.split(',')[1];

    // Decode the base64 data
    const voiceData = Buffer.from(base64VoiceData, 'base64').toString('utf-8');

    // Hash the voice data
    const voiceAuthHash = keccak256(Buffer.from(voiceData, 'utf-8'));

    return {voiceAuthHash};
  }
);
