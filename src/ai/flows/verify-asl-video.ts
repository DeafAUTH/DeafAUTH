// src/ai/flows/verify-asl-video.ts
'use server';
/**
 * @fileOverview ASL Video Authentication flow.
 *
 * - verifyAslVideo - A function that handles the ASL video authentication process.
 * - VerifyAslVideoInput - The input type for the verifyAslVideo function.
 * - VerifyAslVideoOutput - The return type for the verifyAslVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyAslVideoInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "An ASL video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expectedSigns: z
    .array(z.string())
    .describe('An array of expected ASL signs in sequence.'),
});
export type VerifyAslVideoInput = z.infer<typeof VerifyAslVideoInputSchema>;

const VerifyAslVideoOutputSchema = z.object({
  isAuthentic: z.boolean().describe('Whether or not the ASL video is authentic.'),
  message: z.string().describe('The message associated with the authentication result.'),
});
export type VerifyAslVideoOutput = z.infer<typeof VerifyAslVideoOutputSchema>;

export async function verifyAslVideo(input: VerifyAslVideoInput): Promise<VerifyAslVideoOutput> {
  return verifyAslVideoFlow(input);
}

const verifyAslVideoPrompt = ai.definePrompt({
  name: 'verifyAslVideoPrompt',
  input: {schema: VerifyAslVideoInputSchema},
  output: {schema: VerifyAslVideoOutputSchema},
  prompt: `You are an expert in American Sign Language (ASL).

You will verify if the provided ASL video corresponds to the expected sequence of signs.

Analyze the video and cross-reference the signs with the verified library to confirm their correspondence with the expected credentials.

Video: {{media url=videoDataUri}}
Expected Signs: {{expectedSigns}}

Respond with whether the video is authentic or not. Set isAuthentic field accordingly. Also include a message associated with the authentication result.
`,
});

const verifyAslVideoFlow = ai.defineFlow(
  {
    name: 'verifyAslVideoFlow',
    inputSchema: VerifyAslVideoInputSchema,
    outputSchema: VerifyAslVideoOutputSchema,
  },
  async input => {
    const {output} = await verifyAslVideoPrompt(input);
    return output!;
  }
);

