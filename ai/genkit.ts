import {genkit} from 'genkit';
import {openAICompatible} from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    openAICompatible({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    }),
  ],
  model: 'gpt-4o-mini',
});
