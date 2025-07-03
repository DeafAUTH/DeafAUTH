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
  isAuthentic: z.boolean().describe('Whether or not the ASL signs in the video are authentic.'),
  faceDetected: z.boolean().describe('Whether or not a human face was clearly detected in the video.'),
  message: z.string().describe('The message associated with the authentication result, considering both sign and face detection.'),
});
export type VerifyAslVideoOutput = z.infer<typeof VerifyAslVideoOutputSchema>;

export async function verifyAslVideo(input: VerifyAslVideoInput): Promise<VerifyAslVideoOutput> {
  return verifyAslVideoFlow(input);
}

const verifyAslVideoPrompt = ai.definePrompt({
  name: 'verifyAslVideoPrompt',
  input: {schema: VerifyAslVideoInputSchema},
  output: {schema: VerifyAslVideoOutputSchema},
  prompt: `You are an expert in American Sign Language (ASL) and facial recognition.

You will verify if the provided ASL video corresponds to the expected sequence of signs AND contains a clearly visible human face.

1.  **Face Detection**: Analyze the video to determine if a human face is clearly visible throughout the signing process. Set the \`faceDetected\` field to true if a face is present, otherwise false.
2.  **ASL Verification**: Analyze the video and cross-reference the signs with a verified library to confirm their correspondence with the expected credentials. Set the \`isAuthentic\` field to true if the signs are correct, otherwise false.
3.  **Message**: Provide a consolidated message about the result. If face detection fails, the message should indicate that. If sign verification fails, the message should indicate that. Authentication is only successful if BOTH signs are correct AND a face is detected.

Video: {{media url=videoDataUri}}
Expected Signs: {{expectedSigns}}

Respond with whether the signs in the video are authentic, if a face was detected, and a consolidated message.
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