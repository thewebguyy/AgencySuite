import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/env";

// Lazy client — initialized only when needed
let _anthropic: Anthropic | undefined;

export function getAnthropic() {
  if (_anthropic) return _anthropic;
  
  const env = getEnv();
  _anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });
  return _anthropic;
}

// ---------------------------------------------------------------------------
// Rate Limiter (in-memory, per-instance — use Upstash Redis in production)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, lastReset: now };

  if (now - entry.lastReset > windowMs) {
    entry.count = 0;
    entry.lastReset = now;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  rateLimitMap.set(key, entry);
  return true;
}

// ---------------------------------------------------------------------------
// Claude API call with exponential backoff
// ---------------------------------------------------------------------------

export async function callClaude(
  system: string,
  user: string,
  options: {
    stream?: boolean;
    maxTokens?: number;
    retries?: number;
  } = {}
) {
  const { stream = true, maxTokens = 4096, retries = 3 } = options;
  let delay = 2000;
  const anthropic = getAnthropic();

  for (let i = 0; i < retries; i++) {
    try {
      if (stream) {
        return await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
          stream: true,
        });
      }
      return await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });
    } catch (e: any) {
      if ((e.status === 429 || e.status === 529) && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw e;
    }
  }
  throw new Error("Max retries reached for Claude API call");
}

// ---------------------------------------------------------------------------
// SSE stream response helper
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

export function createSSEResponse(
  processor: (
    enqueue: (data: string) => void
  ) => Promise<void>
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        await processor(enqueue);
      } catch (err) {
        enqueue(JSON.stringify({ error: "Stream processing failed" }));
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ---------------------------------------------------------------------------
// Stream text chunks from a Claude streaming response
// ---------------------------------------------------------------------------

export async function processClaudeStream(
  stream: AsyncIterable<any>,
  enqueue: (data: string) => void
): Promise<string> {
  let fullText = "";

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      const text = chunk.delta.text;
      fullText += text;
      enqueue(JSON.stringify({ text }));
    }
  }

  return fullText;
}
