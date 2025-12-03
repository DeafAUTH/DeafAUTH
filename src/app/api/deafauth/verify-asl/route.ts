import {NextResponse} from 'next/server';
import {verifyAslVideo, type VerifyAslVideoOutput} from '@/ai/flows/verify-asl-video';
import { z } from 'zod';

// We can reuse the input schema from the flow for validation
const ApiInputSchema = z.object({
  videoDataUri: z.string(),
  expectedSigns: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ApiInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({errors: validation.error.flatten().fieldErrors}, {status: 400});
    }

    const result = await verifyAslVideo(validation.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("ASL Verification API Error:", error);
    const result: VerifyAslVideoOutput = { isAuthentic: false, faceDetected: false, message: "An unexpected error occurred during verification." };
    return NextResponse.json(result, {status: 500});
  }
}
