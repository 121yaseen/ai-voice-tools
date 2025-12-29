import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {

  const { messages } = await req.json();

  interface MessagePart {
    type: string;
    text: string;
  }

  interface Message {
    role: "user" | "assistant" | "system";
    parts: MessagePart[];
  }

  // Convert UIMessages (with parts) to CoreMessages (with content) for the model

  const coreMessages = messages.map((m: Message) => ({

    role: m.role,

    content: m.parts

      .filter((p: MessagePart) => p.type === 'text')

      .map((p: MessagePart) => p.text)

      .join('\n'),

  }));



  const result = streamText({

    model: google('gemini-3-flash-preview'),

    system: "You are Prompt Enhancer. Rewrite user prompts into clear, structured instructions with role, goal, constraints, tone, and output format. Preserve intent, remove ambiguity, and keep output concise. If input is already strong, return a polished version with minor improvements only.",

    messages: coreMessages,

    temperature: 0.7,

    topP: 0.9,

  });



  return result.toUIMessageStreamResponse();

}
