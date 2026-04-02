import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, FileText, Calendar, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { AcceptProposalButtons } from "@/components/proposals/AcceptProposalButtons";

export default async function PublicProposalViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // Load proposal by share_token
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*, agency:agencies(*), client:clients(*), proposal_items(*), proposal_phases(*)")
    .eq("share_token", token)
    .single();

  if (error || !proposal) {
    notFound();
  }

  // Update viewed_at if null
  if (!proposal.viewed_at) {
    await supabase
      .from("proposals")
      .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
      .eq("id", proposal.id);
  }

  const agencyColor = proposal.agency?.brand_color || "#5B5BD6";

  return (
    <div className="min-h-screen bg-surface">
      {/* Header Accent */}
      <div className="h-2 w-full" style={{ backgroundColor: agencyColor }} />
      
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 space-y-16 bg-white shadow-sm border-x border-border min-h-screen">
        
        {/* Logo & Info */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-border pb-12">
          <div className="space-y-4">
             {proposal.agency?.logo_url ? (
               <img src={proposal.agency.logo_url} alt={proposal.agency.name} className="h-12 object-contain" />
             ) : (
               <span className="text-2xl font-black tracking-tighter text-dark uppercase">{proposal.agency?.name}</span>
             )}
             <div className="flex flex-col gap-1 text-sm text-mid">
                <span>{proposal.agency?.name}</span>
                <span>{proposal.agency?.billing_country}</span>
             </div>
          </div>
          <div className="text-right space-y-2">
            <h1 className="text-4xl font-bold text-dark tracking-tight">{proposal.title}</h1>
            <p className="text-mid">Prepared for <span className="text-dark font-semibold">{proposal.client?.company || proposal.client?.name}</span></p>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Badge variant="surface">Issued {format(new Date(proposal.sent_at || proposal.created_at!), "MMM d, yyyy")}</Badge>
              <Badge variant="brand">Ref: PR-${proposal.id.slice(0, 4).toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        {/* Exec Summary */}
        <section className="space-y-6">
           <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-mid">Executive Summary</h2>
           <p className="text-xl text-dark leading-relaxed font-serif">
             {proposal.executive_summary}
           </p>
        </section>

        {/* Scope */}
        <section className="space-y-6">
           <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-mid">Project Scope</h2>
           <p className="text-dark leading-relaxed">
             {proposal.scope_statement}
           </p>
        </section>

        {/* Deliverables */}
        <section className="space-y-6">
           <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-mid">Deliverables & Investment</h2>
           <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-4 text-xs font-semibold text-mid uppercase">Description</th>
                  <th className="py-4 text-xs font-semibold text-mid uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proposal.proposal_items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-6">
                      <p className="font-bold text-dark">{item.title}</p>
                      <p className="text-sm text-mid mt-1">{item.description}</p>
                    </td>
                    <td className="py-6 text-right font-mono font-medium text-dark">
                      {formatCurrency(item.unit_price * (item.quantity || 1), item.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-dark">
                  <td className="py-6 text-xl font-bold text-dark">Total Project Investment</td>
                  <td className="py-6 text-right text-xl font-bold text-dark" style={{ color: agencyColor }}>
                    {formatCurrency(proposal.total_price, proposal.currency)}
                  </td>
                </tr>
              </tfoot>
           </table>
        </section>

        {/* Timeline */}
        <section className="space-y-6">
           <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-mid">Execution Timeline</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {proposal.proposal_phases.map((phase: any, idx: number) => (
                <div key={idx} className="space-y-3 p-6 border border-border bg-surface/30">
                   <div className="flex items-center justify-between">
                     <h3 className="font-bold text-dark">{phase.phase_name}</h3>
                     <span className="text-xs font-semibold text-mid">{phase.duration_weeks} weeks</span>
                   </div>
                   <ul className="space-y-2">
                      {phase.milestones.map((m: string, midx: number) => (
                        <li key={midx} className="text-sm text-mid flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                           {m}
                        </li>
                      ))}
                   </ul>
                </div>
              ))}
           </div>
        </section>

        {/* Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-border">
           <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-mid">Assumptions</h2>
              <ul className="space-y-2">
                 {proposal.assumptions?.map((a: string, idx: number) => (
                   <li key={idx} className="text-sm text-mid flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-border mt-0.5 shrink-0" />
                      {a}
                   </li>
                 ))}
              </ul>
           </section>
           <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-mid">Out of Scope</h2>
              <ul className="space-y-2">
                 {proposal.out_of_scope?.map((o: string, idx: number) => (
                   <li key={idx} className="text-sm text-mid flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-border mt-0.5 shrink-0" />
                      {o}
                   </li>
                 ))}
              </ul>
           </section>
        </div>

        {/* Acceptance Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-border z-50">
           <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-mid uppercase tracking-widest">Client Decision</p>
                 <p className="text-sm text-dark mt-1">Accept this proposal to move to the contract phase.</p>
              </div>
              <AcceptProposalButtons proposalId={proposal.id} agencyColor={agencyColor} />
           </div>
        </div>
      </div>
    </div>
  );
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
  </svg>
);
