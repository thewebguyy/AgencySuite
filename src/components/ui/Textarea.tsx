import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-mid uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-none border border-border bg-white px-3 py-2 text-sm text-dark placeholder:text-mid focus:outline-none focus:border-brand disabled:opacity-50 transition-colors resize-vertical",
            error && "border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
