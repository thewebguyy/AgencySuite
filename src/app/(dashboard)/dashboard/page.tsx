import { getCurrentAgency } from "@/lib/auth/agency";
import { getDashboardStats, getRecentActivity } from "@/lib/dashboard/stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  FileText, 
  FileCheck, 
  TrendingUp, 
  Briefcase, 
  AlertCircle,
  Eye,
  Signature,
  CheckCircle2,
  FileDown,
  CreditCard,
  Plus,
  BarChart3,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const agency = await getCurrentAgency();
  
  if (!agency) return null; // Should be handled by layout redirect

  const [stats, activities] = await Promise.all([
    getDashboardStats(agency.id),
    getRecentActivity(agency.id)
  ]);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark tracking-tight">Command Center</h1>
          <p className="text-mid mt-1">Snapshot of your agency&apos;s health and tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reports/new">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              New Report
            </Button>
          </Link>
          <Link href="/proposals/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Proposal
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Queue */}
      <section>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-widest mb-4">Action Queue</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.actionQueue.pendingReports > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-700 flex items-center gap-2 text-base">
                  <AlertCircle className="w-4 h-4" />
                  Review Weekly Reports
                </CardTitle>
                <CardDescription className="text-amber-600/80">
                  {stats.actionQueue.pendingReports} reports pending your approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/reports?filter=pending">
                  <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50">
                    Go to Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.actionQueue.awaitingProposals > 0 && (
            <Card className="border-brand/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-brand flex items-center gap-2 text-base">
                  <Eye className="w-4 h-4" />
                  Proposals Awaiting Response
                </CardTitle>
                <CardDescription className="text-mid">
                  {stats.actionQueue.awaitingProposals} sent proposals are over 48h old.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/proposals?filter=stale">
                  <Button variant="outline" size="sm" className="border-brand/20 text-brand hover:bg-brand/5">
                    Follow Up
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.actionQueue.overdueInvoices.map((inv: any) => (
            <Card key={inv.id} className="border-red-200 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center gap-2 text-base">
                  <AlertCircle className="w-4 h-4" />
                  Overdue Invoice
                </CardTitle>
                <CardDescription className="text-red-600/80">
                  {inv.client?.name} — {formatCurrency(inv.total, inv.currency)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/invoices/${inv.id}`}>
                  <Button variant="outline" size="sm" className="bg-white border-red-200 text-red-700 hover:bg-red-50">
                    View Invoice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {stats.actionQueue.pendingReports === 0 && 
           stats.actionQueue.awaitingProposals === 0 && 
           stats.actionQueue.overdueInvoices.length === 0 && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-border flex flex-col items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-dark font-medium">All caught up!</p>
              <p className="text-mid text-sm">No high-priority actions required right now.</p>
            </div>
           )}
        </div>
      </section>

      {/* Pipeline Pulse */}
      <section>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-widest mb-4">Pipeline Pulse</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-mid uppercase">Proposals Sent</CardTitle>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.pulse.sent}</span>
                <FileText className="w-4 h-4 text-brand/40" />
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-mid uppercase">Proposals Won</CardTitle>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.pulse.accepted}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-mid uppercase">Win Rate</CardTitle>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.pulse.winRate}%</span>
                <TrendingUp className="w-4 h-4 text-brand/40" />
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-mid uppercase">Active Projects</CardTitle>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.pulse.activeProjects}</span>
                <Briefcase className="w-4 h-4 text-brand/40" />
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-mid uppercase">Reports This Month</CardTitle>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.pulse.reportsGenerated}</span>
                <BarChart3 className="w-4 h-4 text-brand/40" />
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-widest mb-4">Recent Activity</h2>
        <Card className="rounded-none">
          <CardContent className="p-0">
            {activities.length > 0 ? (
              <div className="divide-y divide-border">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-surface transition-colors">
                    <div className="p-2 bg-surface rounded-full">
                      {activity.type === 'view' && <Eye className="w-4 h-4 text-blue-500" />}
                      {activity.type === 'accept' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {activity.type === 'sign' && <Signature className="w-4 h-4 text-brand" />}
                      {activity.type === 'file' && <FileDown className="w-4 h-4 text-amber-500" />}
                      {activity.type === 'payment' && <CreditCard className="w-4 h-4 text-emerald-600" />}
                      {activity.type === 'report' && <BarChart3 className="w-4 h-4 text-brand" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-dark">{activity.title}</p>
                      <p className="text-xs text-mid">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-mid">
                      {formatDistanceToNow(new Date(activity.date!), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center flex flex-col items-center justify-center bg-brand/5 border-dashed border-2 border-brand/20 m-4 rounded-xl">
                <BarChart3 className="w-10 h-10 text-brand mb-3 opacity-80" />
                <h3 className="text-lg font-semibold text-dark mb-1">Generate your first client report in 60 seconds</h3>
                <p className="text-mid text-sm max-w-md mb-6">Stop wasting hours copying and pasting data. Let AI write an executive-grade report for you right now.</p>
                <Link href="/reports/new">
                  <Button size="lg" className="gap-2 shadow-lg shadow-brand/20">
                    <Sparkles className="w-4 h-4" />
                    Create Report
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
