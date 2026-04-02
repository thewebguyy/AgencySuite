import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

  const { action, currentData } = await req.json();

  let systemPrompt = "";
  let userPrompt = "";

  switch (action) {
    case "shorten-summary":
      systemPrompt = "You are a concise editor for a digital agency. Shorten the provided executive summary while keeping the core value proposition and tone.";
      userPrompt = `Current Summary: ${currentData.executiveSummary}\n\nReturn ONLY the shortened summary text.`;
      break;
    case "add-buffer":
      systemPrompt = "You are a project manager. Increase each phase's duration by 10% (minimum 0.5 week increase) to add a revision buffer.";
      userPrompt = `Current Phases (JSON): ${JSON.stringify(currentData.phases)}\n\nReturn ONLY the updated phases as a JSON array.`;
      break;
    case "suggest-assumptions":
      systemPrompt = "You are a risk manager. Suggest 3 additional specific assumptions for this project scope to protect the agency.";
      userPrompt = `Scope: ${currentData.scopeStatement}\nDeliverables: ${JSON.stringify(currentData.deliverables)}\n\nReturn ONLY a JSON array of 3 strings.`;
      break;
    default:
      return new NextResponse("Invalid action", { status: 400 });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
