// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProposalOutput = {
  executiveSummary: string;
  scopeStatement: string;
  deliverables: Array<{
    title: string;
    description: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
  phases: Array<{
    phaseName: string;
    durationWeeks: number;
    milestones: string[];
  }>;
  assumptions: string[];
  outOfScope: string[];
  totalPrice: number;
  currency: string;
  timelineScaled: boolean;
};

export interface ProposalInput {
  brief: string;
  agencyName: string;
  specializations?: string[];
  budgetMin: number;
  budgetMax: number;
  currency: string;
  timelineWeeks: number;
  pastWins?: string;
}

// ---------------------------------------------------------------------------
// Prompt Builders
// ---------------------------------------------------------------------------

export function buildProposalSystemPrompt(): string {
  return `You are a senior account manager at a boutique digital agency. Your task is to transform a raw client brief into a precise, professional project proposal.

Rules you must follow without exception:
1. Scope must be SPECIFIC. Name exact deliverables — "3x Homepage Wireframes in Figma" not "Design Work." Every deliverable line item must be independently quantifiable.
2. Total pricing must land within the provided budget range. Never underprice by more than 15% or overprice at all.
3. Timeline must include a 10% buffer for revisions. If the sum of phases exceeds the requested timeline, scale each phase proportionally and note the scaling.
4. If the brief is ambiguous, infer scope from the agency's stated specializations.
5. Assumptions must be concrete and specific to this project — not generic legal boilerplate.
6. Return ONLY valid JSON matching the output schema. No preamble. No markdown. No explanation.`;
}

export function buildProposalUserPrompt(input: ProposalInput): string {
  return `Client Brief: ${input.brief}
Agency Name: ${input.agencyName}
Agency Specializations: ${input.specializations?.join(", ") || "General"}
Budget Range: ${input.budgetMin}–${input.budgetMax} ${input.currency}
Requested Timeline: ${input.timelineWeeks} weeks
Past Won Projects (for context and style): ${input.pastWins || "None provided"}

Generate a complete proposal JSON object.
Output schema (validate against this after parsing):
interface ProposalOutput {
  executiveSummary: string;       // 2–3 sentences
  scopeStatement: string;         // 1 paragraph
  deliverables: Array<{
    title: string;
    description: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
  phases: Array<{
    phaseName: string;
    durationWeeks: number;
    milestones: string[];
  }>;
  assumptions: string[];          // 3–5 items
  outOfScope: string[];           // 2–4 items
  totalPrice: number;
  currency: string;
  timelineScaled: boolean;        // true if phases were compressed
}`;
}

// ---------------------------------------------------------------------------
// Post-Processing
// ---------------------------------------------------------------------------

export function postProcessProposal(
  proposal: ProposalOutput,
  constraints: { budgetMin: number; budgetMax: number; timelineWeeks: number }
): { proposal: ProposalOutput; pricesAdjusted: boolean; timelineScaled: boolean } {
  let pricesAdjusted = false;
  let timelineScaled = false;

  // Budget check (± 20% tolerance)
  const total = proposal.totalPrice;
  if (total < constraints.budgetMin * 0.8 || total > constraints.budgetMax * 1.2) {
    const target = (constraints.budgetMin + constraints.budgetMax) / 2;
    const ratio = target / total;
    proposal.deliverables = proposal.deliverables.map((d) => ({
      ...d,
      unitPrice: Math.round(d.unitPrice * ratio),
    }));
    proposal.totalPrice = Math.round(target);
    pricesAdjusted = true;
  }

  // Timeline check
  const totalWeeks = proposal.phases.reduce((acc, p) => acc + p.durationWeeks, 0);
  if (totalWeeks > constraints.timelineWeeks) {
    const ratio = constraints.timelineWeeks / totalWeeks;
    proposal.phases = proposal.phases.map((p) => ({
      ...p,
      durationWeeks: Number((p.durationWeeks * ratio).toFixed(1)),
    }));
    proposal.timelineScaled = true;
    timelineScaled = true;
  }

  return { proposal, pricesAdjusted, timelineScaled };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateProposalInput(input: Partial<ProposalInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.brief || input.brief.length < 50)
    errors.push("Brief is too short. Please provide at least 150 words for better results.");
  if (!input.agencyName?.trim()) errors.push("Agency name is required");
  if (!input.budgetMin || !input.budgetMax)
    errors.push("Budget range is required");
  if (!input.currency) errors.push("Currency is required");
  if (!input.timelineWeeks) errors.push("Timeline is required");

  return { valid: errors.length === 0, errors };
}
