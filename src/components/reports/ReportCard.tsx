import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReportCardProps {
  id: string;
  clientName: string;
  reportingPeriod: string;
  services: string[];
  status: "draft" | "generated" | "sent";
  createdAt: string;
}

export function ReportCard({
  id,
  clientName,
  reportingPeriod,
  services,
  status,
  createdAt,
}: ReportCardProps) {
  const statusVariant = {
    draft: "surface" as const,
    generated: "accent" as const,
    sent: "success" as const,
  };

  return (
    <Link
      href={`/reports/new?id=${id}`}
      className="group block"
    >
      <Card className="hover:border-brand transition-all">
        <CardHeader className="mb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-semibold text-brand truncate">
                {clientName}
              </span>
              <Badge variant={statusVariant[status]}>{status}</Badge>
            </div>
            <ChevronRight className="w-4 h-4 text-border group-hover:text-brand group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <CardTitle className="text-base group-hover:text-brand transition-colors truncate">
            {reportingPeriod}
          </CardTitle>
          <CardDescription className="flex items-center justify-between mt-1">
            <span className="truncate">
              {services.slice(0, 3).join(", ")}
              {services.length > 3 && ` +${services.length - 3}`}
            </span>
            <span className="flex items-center gap-1 text-xs text-mid flex-shrink-0 ml-4">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
