import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const KEY = process.env.GOOGLE_GENAI_API_KEY;

// Guard to fail fast during dev if the key is missing
if (!KEY || KEY.length < 20) {
  // NOTE: this throws only on server; safe for server actions
  throw new Error(
    'Missing/invalid GOOGLE_GENAI_API_KEY. Put it in b2/.env.local and restart the dev server.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: KEY, // ✅ explicitly pass the key to the plugin
    }),
  ],
  // Either set the default model here…
   model: 'googleai/gemini-2.5-flash',  // ✅ no "googleai/" prefix here
});

