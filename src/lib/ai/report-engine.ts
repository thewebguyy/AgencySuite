import type { ReportInput } from "@/types/reports";

// ---------------------------------------------------------------------------
// Prompt Builders
// ---------------------------------------------------------------------------

export function buildReportSystemPrompt(): string {
  return `You are a high-end performance marketing director producing a premium strategic report for an enterprise client. 

CRITICAL DIRECTIVES:
1. NO FLUFF. Use a highly analytical, authoritative, and ultra-concise tone.
2. ZERO generic AI phrasing (e.g., "In conclusion", "As a reminder", "It is important to note").
3. DO NOT estimate or fabricate data. Use ONLY the provided numbers.
4. Output professional markdown without any introductory preamble or signoffs. Start on line 1.

REQUIRED STRUCTURE:
## 1. TL;DR
Maximum 2 sentences. Deliver the bottom-line performance impact immediately.

## 2. Data Snapshot
Use the provided metrics. Present as a clean, scannable format.

## 3. Strategic Insights
Analyze what the data means. Frame any challenges constructively alongside an immediate countermeasure. Wins must be stated objectively without exaggeration.

## 4. Action Plan
Bullet list of concrete, owner-driven next steps. Format as "• [Action]: [Expected Outcome]".`;
}

export function buildReportUserPrompt(input: ReportInput): string {
  const metricsText = Object.entries(input.metrics)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([key, value]) => `- ${formatMetricKey(key)}: ${value}`)
    .join("\n");

  return `Generate a weekly performance report with these details:

Agency: ${input.agencyName}
Client: ${input.clientName}
Reporting Period: ${input.reportingPeriod}
Services: ${input.services.join(", ")}

Performance Metrics:
${metricsText || "No specific metrics provided — summarize at a high level."}

Key Wins This Week:
${input.wins.length > 0 ? input.wins.map((w) => `- ${w}`).join("\n") : "- No specific wins noted"}

Challenges:
${input.challenges.length > 0 ? input.challenges.map((c) => `- ${c}`).join("\n") : "- No major challenges"}

Planned Next Steps:
${input.nextSteps.length > 0 ? input.nextSteps.map((s) => `- ${s}`).join("\n") : "- Continue current strategy"}

Tone: ${input.tone}

Write the full report now.`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateReportInput(input: Partial<ReportInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.agencyName?.trim()) errors.push("Agency name is required");
  if (!input.clientName?.trim()) errors.push("Client name is required");
  if (!input.reportingPeriod?.trim())
    errors.push("Reporting period is required");
  if (!input.services || input.services.length === 0)
    errors.push("At least one service is required");

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMetricKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
