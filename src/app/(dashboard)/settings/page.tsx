import { getCurrentAgency } from "@/lib/auth/agency";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Building2, Palette, Globe } from "lucide-react";

export default async function SettingsPage() {
  const agency = await getCurrentAgency();

  if (!agency) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark tracking-tight">Settings</h1>
        <p className="text-mid">Manage your agency profile and preferences.</p>
      </div>

      {/* Agency Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4 text-brand" />
            Agency Information
          </CardTitle>
          <CardDescription>
            These details are used in your reports and proposals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Agency Name"
            value={agency.name}
            disabled
            className="bg-surface"
          />
          <Input
            label="Slug"
            value={agency.slug}
            disabled
            className="bg-surface"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-mid uppercase tracking-wider">
              Specializations
            </label>
            <div className="flex flex-wrap gap-2">
              {agency.specializations?.length ? (
                agency.specializations.map((spec: string) => (
                  <Badge key={spec} variant="accent">
                    {spec}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-mid">No specializations set</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-4 h-4 text-brand" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mid uppercase tracking-wider">
                Brand Color
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 border border-border"
                  style={{ backgroundColor: agency.brand_color || "#5B5BD6" }}
                />
                <span className="text-sm text-dark font-mono">
                  {agency.brand_color || "#5B5BD6"}
                </span>
              </div>
            </div>
          </div>
          {agency.logo_url && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mid uppercase tracking-wider">
                Logo
              </label>
              <img
                src={agency.logo_url}
                alt="Agency logo"
                className="h-12 object-contain border border-border p-2 bg-white"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-brand" />
            Billing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Billing Country"
            value={agency.billing_country || "Not set"}
            disabled
            className="bg-surface"
          />
          <Input
            label="Payment Provider"
            value={agency.payment_provider || "Not set"}
            disabled
            className="bg-surface"
          />
        </CardContent>
      </Card>

      <p className="text-xs text-mid">
        To update agency settings, use the organization settings in your Clerk dashboard
        or contact support.
      </p>
    </div>
  );
}
