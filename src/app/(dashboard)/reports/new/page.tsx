import { getCurrentAgency } from "@/lib/auth/agency";
import { redirect } from "next/navigation";
import ReportGenerator from "@/components/reports/ReportGenerator";

export default async function NewReportPage() {
  const agency = await getCurrentAgency();

  if (!agency) {
    redirect("/onboarding");
  }

  return <ReportGenerator agencyName={agency.name} />;
}
