import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is not set" },
      { status: 500 }
    );
  }

  // Return the API key directly for WebSocket authentication
  // The token query parameter works with both API keys and access tokens
  // For production, you may want to use temporary tokens via deepgram.auth.grantToken()
  return NextResponse.json({ key: deepgramApiKey });
}
