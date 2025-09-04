'use server';
/**
 * @fileOverview An AI-powered tool for forecasting healthcare demand based on pincodes.
 *
 * - forecastDemand - A function that handles the demand forecasting process.
 * - ForecastDemandInput - The input type for the forecastDemand function.
 * - ForecastDemandOutput - The return type for the forecastDemand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastDemandInputSchema = z.object({
  pincode: z.string().describe('The pincode for which to forecast healthcare demand.'),
});
export type ForecastDemandInput = z.infer<typeof ForecastDemandInputSchema>;

const ForecastDemandOutputSchema = z.object({
  demandLevel: z.enum(['Low', 'Medium', 'High']).describe('The predicted demand level.'),
  reasoning: z.string().describe('The reasoning behind the predicted demand level, considering factors like demographics, local events, or seasonal trends.'),
  suggestedActions: z.array(z.string()).describe('A list of suggested actions for the hospital to take based on the forecast.'),
});
export type ForecastDemandOutput = z.infer<typeof ForecastDemandOutputSchema>;

export async function forecastDemand(input: ForecastDemandInput): Promise<ForecastDemandOutput> {
  return forecastDemandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastDemandPrompt',
  input: {schema: ForecastDemandInputSchema},
  output: {schema: ForecastDemandOutputSchema},
  prompt: `You are a healthcare operations analyst AI for a major hospital chain. Your task is to forecast patient demand for a specific area based on its pincode.

  Analyze the provided pincode: {{{pincode}}}.

  Based on this pincode, generate a fictional but plausible demand forecast. Consider factors such as:
  - Assumed population density (urban vs. rural).
  - Potential for local events (e.g., festivals, marathons).
  - Seasonal health trends (e.g., flu season in winter, allergies in spring).
  - Common industrial or environmental factors associated with such an area.

  Your output must include:
  1.  A 'demandLevel' of 'Low', 'Medium', or 'High'.
  2.  A 'reasoning' string explaining the key factors for your forecast.
  3.  A 'suggestedActions' array with 2-3 concrete steps the hospital should consider (e.g., "Increase ER staffing by 10%", "Stock up on flu vaccines", "Prepare for potential trauma cases from the upcoming marathon").`,
});

const forecastDemandFlow = ai.defineFlow(
  {
    name: 'forecastDemandFlow',
    inputSchema: ForecastDemandInputSchema,
    outputSchema: ForecastDemandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
