"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Check, Save, FileText, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReportOutputProps {
  content: string;
  isStreaming: boolean;
  onSave: () => void;
  isSaving: boolean;
  savedId?: string;
}

export function ReportOutput({
  content,
  isStreaming,
  onSave,
  isSaving,
  savedId,
}: ReportOutputProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: "Copied!", description: "Report copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select the text and copy manually.",
        variant: "destructive",
      });
    }
  };

  if (!content) return null;

  return (
    <div className="border border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand" />
          <span className="text-xs font-semibold text-mid uppercase tracking-widest">
            Generated Report
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand font-medium">
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
              Writing…
            </span>
          )}
        </div>

        {!isStreaming && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Premium Feature",
                  description: "Upgrade to Agency Pro to export beautiful PDF reports.",
                });
              }}
              className="gap-1.5 opacity-80"
            >
              <FileDown className="w-3.5 h-3.5 text-mid" />
              Export PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={isSaving || !!savedId}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {savedId ? "Saved" : isSaving ? "Saving…" : "Save Report"}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="p-6 max-h-[600px] overflow-y-auto prose-custom"
      >
        <ReportMarkdown content={content} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lightweight markdown renderer (avoids adding react-markdown dependency)
// ---------------------------------------------------------------------------

function ReportMarkdown({ content }: { content: string }) {
  const html = markdownToHtml(content);
  return (
    <div
      className="report-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-dark mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-dark mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-dark mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-dark">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="text-sm text-dark/80 ml-4 mb-1 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="text-sm text-dark/80 ml-4 mb-1 list-decimal">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    // Paragraphs — wrap remaining text lines
    .replace(/^(?!<[hlou]|<li|<hr)(.+)$/gm, '<p class="text-sm text-dark/80 mb-3 leading-relaxed">$1</p>');

  return html;
}
