import { config } from 'dotenv';
config();

import '@/ai/flows/generate-voice-auth-hash.ts';
import '@/ai/flows/parse-transaction-intent.ts';