"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  AVAILABLE_SERVICES,
  COMMON_METRICS,
  TONE_OPTIONS,
  type ReportInput,
} from "@/types/reports";
import { Loader2, Sparkles, ChevronDown, ChevronRight, Plus } from "lucide-react";

interface ReportFormProps {
  agencyName: string;
  onGenerate: (data: ReportInput) => void;
  isGenerating: boolean;
}

const DRAFT_KEY = "report_form_draft";

export function ReportForm({
  agencyName,
  onGenerate,
  isGenerating,
}: ReportFormProps) {
  const [clientName, setClientName] = useState("");
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "executive">("professional");
  const [errors, setErrors] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from("clients").select("id, name").eq("is_archived", false);
      if (data) setClients(data);

      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setClientName(parsed.clientName || "");
          setReportingPeriod(parsed.reportingPeriod || "");
          setSelectedServices(parsed.services || []);
          setMetrics(parsed.metrics || {});
          setWins(parsed.wins || "");
          setChallenges(parsed.challenges || "");
          setNextSteps(parsed.nextSteps || "");
          setTone(parsed.tone || "professional");
          return;
        } catch { }
      }

      // Default to last week
      const today = new Date();
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay());
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      setReportingPeriod(`${fmt(lastWeekStart)} - ${fmt(lastWeekEnd)}`);
    }
    init();
  }, []);

  const handleFillSample = () => {
    setShowNewClientInput(true);
    setClientName("Acme Corp (Sample)");
    setSelectedServices(["Google Ads", "Meta Ads", "SEO"]);
    setMetrics({
      spend: "4250",
      revenue: "18400",
      roas: "4.3",
      cpa: "32.50",
      leads: "142",
      cpc: "1.12",
      ctr: "2.4"
    });
    setIsMetricsOpen(true);
    setWins("Reduced CPA by 18% on Google Ads\nNew landing page drove 2x conversions\nMeta retargeting ROAS hit 4.2x");
    setChallenges("Rising CPMs on Meta due to seasonal demand");
    setNextSteps("Launch new creative batch targeting high-intent audiences\nA/B test landing page headline variants");
    setTone("executive");
  };

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      clientName, reportingPeriod, services: selectedServices, metrics, wins, challenges, nextSteps, tone
    }));
  }, [clientName, reportingPeriod, selectedServices, metrics, wins, challenges, nextSteps, tone]);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleMetricChange = (key: string, value: string) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const linesToArray = (text: string): string[] =>
    text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors: string[] = [];
      if (!clientName.trim()) validationErrors.push("Client name is required");
      if (!reportingPeriod.trim())
        validationErrors.push("Reporting period is required");
      if (selectedServices.length === 0)
        validationErrors.push("Select at least one service");

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setErrors([]);

      // Build metrics object — only include non-empty values
      const cleanMetrics: Record<string, number | string> = {};
      for (const [key, value] of Object.entries(metrics)) {
        if (value.trim()) {
          const num = Number(value);
          cleanMetrics[key] = isNaN(num) ? value : num;
        }
      }

      onGenerate({
        agencyName,
        clientName: clientName.trim(),
        reportingPeriod: reportingPeriod.trim(),
        services: selectedServices,
        metrics: cleanMetrics,
        wins: linesToArray(wins),
        challenges: linesToArray(challenges),
        nextSteps: linesToArray(nextSteps),
        tone,
      });
    },
    [
      agencyName,
      clientName,
      reportingPeriod,
      selectedServices,
      metrics,
      wins,
      challenges,
      nextSteps,
      tone,
      onGenerate,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4">
          <ul className="text-sm text-rose-700 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Core Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-mid uppercase tracking-widest">
            Report Details
          </h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleFillSample}
            className="text-xs gap-1 border-brand/20 text-brand bg-brand/5 hover:bg-brand/10 hover:border-brand/40"
          >
            <Sparkles className="w-3 h-3" />
            Fill with Sample Data
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Agency Name"
            value={agencyName}
            disabled
            className="bg-surface"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-mid uppercase tracking-wider">
              Client Name
            </label>
            {!showNewClientInput ? (
              <select
                value={clientName}
                onChange={(e) => {
                  if (e.target.value === "NEW") {
                    setShowNewClientInput(true);
                    setClientName("");
                  } else {
                    setClientName(e.target.value);
                  }
                }}
                className="w-full flex h-10 border border-border bg-white px-3 py-2 text-sm text-dark focus:outline-none focus:border-brand transition-colors appearance-none"
              >
                <option value="" disabled>Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="NEW">+ Add new client</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="flex-1 h-10 border border-border bg-white px-3 py-2 text-sm text-dark focus:outline-none focus:border-brand transition-colors"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowNewClientInput(false);
                    setClientName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
        <Input
          label="Reporting Period"
          placeholder="e.g. March 24 – March 30, 2026"
          value={reportingPeriod}
          onChange={(e) => setReportingPeriod(e.target.value)}
        />
      </div>

      {/* Services */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-mid uppercase tracking-widest">
          Services
        </h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SERVICES.map((service) => {
            const active = selectedServices.includes(service);
            return (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                  active
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-mid border-border hover:border-brand hover:text-brand"
                }`}
              >
                {service}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3 border border-border p-4 bg-white/50">
        <button
          type="button"
          onClick={() => setIsMetricsOpen(!isMetricsOpen)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-mid uppercase tracking-widest">
              Performance Metrics
            </h3>
            <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded font-medium">
              Optional
            </span>
          </div>
          {isMetricsOpen ? (
            <ChevronDown className="w-4 h-4 text-mid" />
          ) : (
            <ChevronRight className="w-4 h-4 text-mid" />
          )}
        </button>
        
        {isMetricsOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 mt-3 border-t border-border/50">
            {COMMON_METRICS.map(({ key, label, prefix }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[11px] text-mid font-medium">
                  {label}
                </label>
                <div className="relative">
                  {prefix && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-mid">
                      {prefix}
                    </span>
                  )}
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="—"
                    value={metrics[key] || ""}
                    onChange={(e) => handleMetricChange(key, e.target.value)}
                    className={`w-full h-9 border border-border bg-white text-sm text-dark placeholder:text-mid/40 focus:outline-none focus:border-brand transition-colors ${
                      prefix ? "pl-6 pr-3" : "px-3"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Qualitative Inputs */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-mid uppercase tracking-widest">
          Narrative
        </h3>
        <Textarea
          label="Key Wins (one per line)"
          placeholder={"Reduced CPA by 18% on Google Ads\nNew landing page drove 2x conversions\nMeta retargeting ROAS hit 4.2x"}
          rows={3}
          value={wins}
          onChange={(e) => setWins(e.target.value)}
        />
        <Textarea
          label="Challenges (one per line)"
          placeholder={"Rising CPMs on Meta due to seasonal demand\nCreative fatigue on top-performing ad sets"}
          rows={3}
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
        />
        <Textarea
          label="Next Steps (one per line)"
          placeholder={"Launch new creative batch targeting high-intent audiences\nA/B test landing page headline variants\nExpand Google Ads to Performance Max"}
          rows={3}
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
        />
      </div>

      {/* Tone */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-mid uppercase tracking-widest">
          Report Tone
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTone(option.value)}
              className={`p-3 border text-left transition-all ${
                tone === option.value
                  ? "border-brand bg-brand/5"
                  : "border-border bg-white hover:border-brand/40"
              }`}
            >
              <span
                className={`text-sm font-medium block ${
                  tone === option.value ? "text-brand" : "text-dark"
                }`}
              >
                {option.label}
              </span>
              <span className="text-[11px] text-mid mt-0.5 block">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={isGenerating}
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Report…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Report
          </>
        )}
      </Button>
    </form>
  );
}
