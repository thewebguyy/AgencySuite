"use client";

import { useState, useCallback } from "react";
import { ReportForm } from "@/components/reports/ReportForm";
import { ReportOutput } from "@/components/reports/ReportOutput";
import { toast } from "@/hooks/use-toast";
import type { ReportInput } from "@/types/reports";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ReportGeneratorProps {
  agencyName: string;
}

export default function ReportGenerator({ agencyName }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [lastInput, setLastInput] = useState<ReportInput | null>(null);

  const handleGenerate = useCallback(async (data: ReportInput) => {
    setIsGenerating(true);
    setGeneratedContent("");
    setSavedId(undefined);
    setLastInput(data);

    try {
      const response = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Generation failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              setGeneratedContent((prev) => prev + parsed.text);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!lastInput || !generatedContent) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lastInput,
          generatedContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save report");
      }

      const { report } = await response.json();
      setSavedId(report.id);
      toast({
        title: "Report Saved",
        description: "Your report has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [lastInput, generatedContent]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/reports"
          className="p-2 hover:bg-surface transition-colors text-mid hover:text-dark"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark tracking-tight">
            Generate Report
          </h1>
          <p className="text-mid text-sm">
            Fill in the details and let AI generate your weekly client report.
          </p>
        </div>
      </div>

      {/* Form */}
      <ReportForm
        agencyName={agencyName}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      {/* Output */}
      <ReportOutput
        content={generatedContent}
        isStreaming={isGenerating}
        onSave={handleSave}
        isSaving={isSaving}
        savedId={savedId}
      />
    </div>
  );
}
