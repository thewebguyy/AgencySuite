export interface ReportInput {
  agencyName: string;
  clientName: string;
  reportingPeriod: string;
  services: string[];
  metrics: Record<string, number | string>;
  wins: string[];
  challenges: string[];
  nextSteps: string[];
  tone: "professional" | "casual" | "executive";
}

export interface ReportFormData extends ReportInput {
  clientId?: string;
}

export interface SavedReport {
  id: string;
  agency_id: string;
  client_id: string | null;
  agency_name: string;
  client_name: string;
  reporting_period: string;
  services: string[];
  metrics: Record<string, number | string>;
  wins: string[];
  challenges: string[];
  next_steps: string[];
  tone: string;
  generated_content: string | null;
  status: "draft" | "generated" | "sent";
  sent_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const AVAILABLE_SERVICES = [
  "Google Ads",
  "Meta Ads",
  "SEO",
  "Social Media",
  "Email Marketing",
  "Content Marketing",
  "TikTok Ads",
  "LinkedIn Ads",
  "Web Development",
  "Analytics",
] as const;

export const COMMON_METRICS = [
  { key: "ad_spend", label: "Ad Spend", prefix: "$" },
  { key: "impressions", label: "Impressions", prefix: "" },
  { key: "clicks", label: "Clicks", prefix: "" },
  { key: "conversions", label: "Conversions", prefix: "" },
  { key: "revenue", label: "Revenue", prefix: "$" },
  { key: "ctr", label: "CTR (%)", prefix: "" },
  { key: "cpc", label: "CPC", prefix: "$" },
  { key: "roas", label: "ROAS", prefix: "" },
] as const;

export const TONE_OPTIONS = [
  { value: "professional" as const, label: "Professional", description: "Formal, data-driven, polished" },
  { value: "casual" as const, label: "Casual", description: "Conversational, approachable" },
  { value: "executive" as const, label: "Executive", description: "Ultra-concise, KPI-focused" },
] as const;
