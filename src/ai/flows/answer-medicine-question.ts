'use server';
/**
 * @fileOverview An AI-powered tool for answering questions about specific medications.
 *
 * - answerMedicineQuestion - A function that handles answering medicine-related questions.
 * - AnswerMedicineQuestionInput - The input type for the answerMedicineQuestion function.
 * - AnswerMedicineQuestionOutput - The return type for the answerMedicineQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerMedicineQuestionInputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine the user is asking about.'),
  question: z.string().describe('The user\'s question about the medicine.'),
});
export type AnswerMedicineQuestionInput = z.infer<typeof AnswerMedicineQuestionInputSchema>;

const AnswerMedicineQuestionOutputSchema = z.object({
  answer: z.string().describe('A clear and helpful answer to the user\'s question about the specified medicine.'),
});
export type AnswerMedicineQuestionOutput = z.infer<typeof AnswerMedicineQuestionOutputSchema>;

export async function answerMedicineQuestion(input: AnswerMedicineQuestionInput): Promise<AnswerMedicineQuestionOutput> {
  return answerMedicineQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerMedicineQuestionPrompt',
  input: {schema: AnswerMedicineQuestionInputSchema},
  output: {schema: AnswerMedicineQuestionOutputSchema},
  prompt: `You are a helpful and knowledgeable AI pharmacy assistant. Your role is to provide clear, safe, and easy-to-understand information about medications. You are not a doctor and you must not provide medical advice.

A user is asking about the medicine: **{{{medicineName}}}**.

Their question is: "**{{{question}}}**"

Please provide a helpful and direct answer to their question. Frame your answer in a way that is easy for a layperson to understand. Do not provide medical advice, diagnoses, or tell the user to change their medication schedule. If the question is about whether they should take a drug or asks for medical advice, your answer should be "Please consult with your doctor or a pharmacist for medical advice."`,
});

const answerMedicineQuestionFlow = ai.defineFlow(
  {
    name: 'answerMedicineQuestionFlow',
    inputSchema: AnswerMedicineQuestionInputSchema,
    outputSchema: AnswerMedicineQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
