import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  callClaude,
  createSSEResponse,
  processClaudeStream,
} from "@/lib/ai/shared";
import {
  buildProposalSystemPrompt,
  buildProposalUserPrompt,
  postProcessProposal,
  validateProposalInput,
  type ProposalOutput,
  type ProposalInput,
} from "@/lib/ai/proposal-engine";

export const runtime = "edge";

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!checkRateLimit(`proposal:${orgId}`)) {
    return new NextResponse("Rate limit exceeded (10 req/min)", { status: 429 });
  }

  const body: ProposalInput = await req.json();
  const { valid, errors } = validateProposalInput(body);

  if (!valid) {
    return NextResponse.json({
      error: errors[0],
      briefTemplate: `Project Type: Website Redesign\nClient Overview: Luxury watch retailer...\nGoals: Increase mobile conversion...`
    }, { status: 400 });
  }

  const systemPrompt = buildProposalSystemPrompt();
  const userPrompt = buildProposalUserPrompt(body);

  try {
    const stream = await callClaude(systemPrompt, userPrompt, {
      stream: true,
      maxTokens: 4096,
    });

    const encoder = new TextEncoder();

    return createSSEResponse(async (enqueue) => {
      const fullText = await processClaudeStream(
        stream as AsyncIterable<any>,
        enqueue
      );

      // Post-processing after stream completes
      try {
        const jsonStart = fullText.indexOf("{");
        const jsonEnd = fullText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const proposal: ProposalOutput = JSON.parse(
            fullText.substring(jsonStart, jsonEnd + 1)
          );

          const result = postProcessProposal(proposal, {
            budgetMin: body.budgetMin,
            budgetMax: body.budgetMax,
            timelineWeeks: body.timelineWeeks,
          });

          enqueue(
            JSON.stringify({
              isPostProcess: true,
              proposal: result.proposal,
              pricesAdjusted: result.pricesAdjusted,
              timelineScaled: result.timelineScaled,
            })
          );
        }
      } catch (e) {
        console.error("JSON Post-processing error", e);
      }
    });
  } catch (error: any) {
    if (error.status === 429 || error.status === 529) {
      return NextResponse.json(
        {
          queued: true,
          message: "Generation queued. You'll be notified when ready.",
        },
        { status: 503 }
      );
    }
    return new NextResponse("Generation failed", { status: 500 });
  }
}
