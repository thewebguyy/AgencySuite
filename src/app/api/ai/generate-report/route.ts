import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  callClaude,
  createSSEResponse,
  processClaudeStream,
} from "@/lib/ai/shared";
import {
  buildReportSystemPrompt,
  buildReportUserPrompt,
  validateReportInput,
} from "@/lib/ai/report-engine";
import type { ReportInput } from "@/types/reports";

export const runtime = "edge";

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!checkRateLimit(`report:${orgId}`)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: ReportInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { valid, errors } = validateReportInput(body);
  if (!valid) {
    return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  }

  const systemPrompt = buildReportSystemPrompt();
  const userPrompt = buildReportUserPrompt(body);

  try {
    const stream = await callClaude(systemPrompt, userPrompt, {
      stream: true,
      maxTokens: 4096,
    });

    return createSSEResponse(async (enqueue) => {
      await processClaudeStream(stream as AsyncIterable<any>, enqueue);
    });
  } catch (error: any) {
    if (error.status === 429 || error.status === 529) {
      return NextResponse.json(
        { error: "AI service is busy. Please try again in a moment." },
        { status: 503 }
      );
    }
    console.error("Report generation error:", error);
    return new NextResponse("Generation failed", { status: 500 });
  }
}
