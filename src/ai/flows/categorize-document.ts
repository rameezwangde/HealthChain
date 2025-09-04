'use server';
/**
 * @fileOverview An AI-powered tool to categorize and name uploaded medical documents.
 *
 * - categorizeDocument - A function that handles the document analysis process.
 * - CategorizeDocumentInput - The input type for the categorizeDocument function.
 * - CategorizeDocumentOutput - The return type for the categorizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeDocumentInputSchema = z.object({
  fileName: z.string().describe('The original filename of the document.'),
  fileDataUri: z
    .string()
    .describe(
      "The document's content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CategorizeDocumentInput = z.infer<typeof CategorizeDocumentInputSchema>;

const CategorizeDocumentOutputSchema = z.object({
  recordName: z.string().describe('A concise, descriptive name for the document (e.g., "Blood Test Results - Jan 2024", "Chest X-Ray Report").'),
  recordType: z.enum(['Lab Report', 'Imaging', 'Prescription', 'PDF']).describe('The classified type of the document.'),
});
export type CategorizeDocumentOutput = z.infer<typeof CategorizeDocumentOutputSchema>;

export async function categorizeDocument(input: CategorizeDocumentInput): Promise<CategorizeDocumentOutput> {
  return categorizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeDocumentPrompt',
  input: {schema: CategorizeDocumentInputSchema},
  output: {schema: CategorizeDocumentOutputSchema},
  prompt: `You are an expert medical records clerk. Your job is to analyze a medical document and categorize it correctly.

Analyze the following document:
Original Filename: {{{fileName}}}
Document Content: {{media url=fileDataUri}}

Based on the content, determine a clear, concise 'recordName' for this document. For example, instead of "scan_098.pdf", a good name would be "MRI Scan of Right Knee".

Then, classify the document into one of the following 'recordType' categories:
- 'Lab Report': For blood work, urinalysis, etc.
- 'Imaging': For X-Rays, MRIs, CT scans, etc.
- 'Prescription': For medication prescriptions from a doctor.
- 'PDF': For general documents, consultation summaries, or anything that doesn't fit the other categories.`,
});

const categorizeDocumentFlow = ai.defineFlow(
  {
    name: 'categorizeDocumentFlow',
    inputSchema: CategorizeDocumentInputSchema,
    outputSchema: CategorizeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
