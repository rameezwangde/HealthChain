import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-patient-files.ts';
import '@/ai/flows/forecast-demand.ts';
import '@/ai/flows/find-specialist.ts';
import '@/ai/flows/answer-medicine-question.ts';
import '@/ai/flows/categorize-document.ts';
