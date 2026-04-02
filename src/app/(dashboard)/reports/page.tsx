import { getCurrentAgency } from "@/lib/auth/agency";
import { redirect } from "next/navigation";
import { getReports } from "@/lib/reports/queries";
import { ReportCard } from "@/components/reports/ReportCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";

export default async function ReportsPage() {
  const agency = await getCurrentAgency();

  if (!agency) {
    redirect("/onboarding");
  }

  let reports: any[] = [];
  try {
    reports = await getReports(agency.id);
  } catch {
    // Table might not exist yet — show empty state
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark tracking-tight">
            Reports
          </h1>
          <p className="text-mid">
            AI-generated weekly performance reports for your clients.
          </p>
        </div>
        <Link href="/reports/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              clientName={report.client_name}
              reportingPeriod={report.reporting_period}
              services={report.services || []}
              status={report.status}
              createdAt={report.created_at}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-border flex flex-col items-center">
          <BarChart3 className="w-12 h-12 text-mid opacity-20 mb-4" />
          <p className="text-mid font-medium">No reports yet.</p>
          <p className="text-mid text-sm mt-1 mb-4">
            Generate your first AI-powered weekly report.
          </p>
          <Link href="/reports/new">
            <Button variant="outline">Create your first report</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
