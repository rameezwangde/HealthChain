'use server';
/**
 * @fileOverview An AI-powered tool for suggesting a medical specialist based on symptoms.
 *
 * - findSpecialist - A function that handles the specialist suggestion process.
 * - FindSpecialistInput - The input type for the findSpecialist function.
 * - FindSpecialistOutput - The return type for the findSpecialist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindSpecialistInputSchema = z.object({
  symptoms: z.string().describe('A description of the patient\'s symptoms.'),
});
export type FindSpecialistInput = z.infer<typeof FindSpecialistInputSchema>;

const FindSpecialistOutputSchema = z.object({
  specialist: z.string().describe('The suggested medical specialty (e.g., "Cardiologist", "Dermatologist").'),
  reasoning: z.string().describe('A brief explanation for why this specialist is recommended based on the symptoms.'),
});
export type FindSpecialistOutput = z.infer<typeof FindSpecialistOutputSchema>;

export async function findSpecialist(input: FindSpecialistInput): Promise<FindSpecialistOutput> {
  return findSpecialistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findSpecialistPrompt',
  input: {schema: FindSpecialistInputSchema},
  output: {schema: FindSpecialistOutputSchema},
  prompt: `You are a helpful medical triage AI. Your job is to recommend a medical specialist based on a patient's symptoms.

Analyze the following symptoms:
"{{{symptoms}}}"

Based on these symptoms, recommend the most appropriate specialist (e.g., Cardiologist, Neurologist, Orthopedist, etc.) and provide a very brief, one-sentence reasoning. Do not provide medical advice or diagnoses.`,
});

const findSpecialistFlow = ai.defineFlow(
  {
    name: 'findSpecialistFlow',
    inputSchema: FindSpecialistInputSchema,
    outputSchema: FindSpecialistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
