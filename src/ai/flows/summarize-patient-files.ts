
'use server';
/**
 * @fileOverview AI-powered tool to summarize a patient's complete medical history, including files and consultation notes, and to highlight critical items for a doctor's review.
 *
 * - summarizePatientFiles - A function that handles the summarization of patient files and notes.
 * - SummarizePatientFilesInput - The input type for the summarizePatientFiles function.
 * - SummarizePatientFilesOutput - The return type for the summarizePatientFiles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePatientFilesInputSchema = z.object({
  patientFiles: z.array(
    z.object({
      fileName: z.string().describe('The name of the patient file.'),
      fileDataUri: z
        .string()
        .describe(
          "The patient file's content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    })
  ).describe('An array of patient files to summarize.'),
  consultationNotes: z.array(
      z.object({
          doctor: z.string(),
          date: z.string(),
          notes: z.string(),
      })
  ).describe("An array of past consultation notes."),
});
export type SummarizePatientFilesInput = z.infer<typeof SummarizePatientFilesInputSchema>;

const SummarizePatientFilesOutputSchema = z.object({
  holisticSummary: z.string().describe("A concise, holistic summary of the patient's entire medical history, synthesizing information from all provided documents and notes."),
  criticalDocuments: z.array(
    z.string().describe("A list of the names of the most critical documents or consultations a doctor should review first (e.g., 'Blood Test Analysis', 'Consultation with Dr. Hanson on 2023-07-22').")
  ).describe('An array of critical document/consultation names.'),
});
export type SummarizePatientFilesOutput = z.infer<typeof SummarizePatientFilesOutputSchema>;

export async function summarizePatientFiles(input: SummarizePatientFilesInput): Promise<SummarizePatientFilesOutput> {
  return summarizePatientFilesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatientFilesPrompt',
  input: {schema: SummarizePatientFilesInputSchema},
  output: {schema: SummarizePatientFilesOutputSchema},
  prompt: `You are an expert AI medical assistant. Your task is to provide a clear, concise, and holistic summary of a patient's medical history for a doctor who is short on time.

Analyze the following documents and consultation notes. Create a single, synthesized summary of the patient's overall health status and history.

After the summary, identify the 2-3 most critical documents or consultation notes that the doctor must review for a comprehensive understanding. These should be the most impactful items (e.g., recent critical lab results, specialist consultations with important findings, etc.).

**Patient Files:**
{{#if patientFiles}}
  {{#each patientFiles}}
  - File Name: {{this.fileName}}
    File Content: {{media url=this.fileDataUri}}
  {{/each}}
{{else}}
  No files provided.
{{/if}}

**Consultation History:**
{{#if consultationNotes}}
    {{#each consultationNotes}}
    - Date: {{this.date}}
      Doctor: {{this.doctor}}
      Notes: {{this.notes}}
    {{/each}}
{{else}}
    No consultation notes provided.
{{/if}}
`,
});

const summarizePatientFilesFlow = ai.defineFlow(
  {
    name: 'summarizePatientFilesFlow',
    inputSchema: SummarizePatientFilesInputSchema,
    outputSchema: SummarizePatientFilesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
