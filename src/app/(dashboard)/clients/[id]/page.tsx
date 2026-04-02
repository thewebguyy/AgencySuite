import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { 
  FileText, 
  FileSignature, 
  CreditCard,
  Mail,
  Phone,
  Globe
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: client },
    { data: proposals },
    { data: contracts },
    { data: invoices }
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("proposals").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("client_id", id).order("signed_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("client_id", id).order("created_at", { ascending: false })
  ]);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm text-mid hover:text-dark transition-colors mb-2 block">← Back to Clients</Link>
          <h1 className="text-3xl font-bold text-dark">{client.name}</h1>
          <p className="text-lg text-mid">{client.company}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Edit Details</Button>
          <Button size="sm">Create Proposal</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-mid">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-dark">
                <Mail className="w-4 h-4 text-mid" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-3 text-sm text-dark">
                  <Phone className="w-4 h-4 text-mid" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.country && (
                <div className="flex items-center gap-3 text-sm text-dark">
                  <Globe className="w-4 h-4 text-mid" />
                  <span>{client.country}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-mid">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-mid italic">"{client.notes}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Tabs/Sections */}
        <div className="lg:col-span-3 space-y-8">
          {/* Proposals */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                Proposals
              </h2>
            </div>
            {proposals && proposals.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {proposals.map((p) => (
                  <Card key={p.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link href={`/proposals/${p.id}/edit`} className="font-semibold text-dark hover:text-brand transition-colors">
                          {p.title}
                        </Link>
                        <p className="text-xs text-mid mt-1">
                          Created {format(new Date(p.created_at!), "MMM d, yyyy")} • {formatCurrency(p.total_price, p.currency!)}
                        </p>
                      </div>
                      <Badge variant={p.status === 'accepted' ? 'success' : 'surface'}>
                        {p.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mid bg-surface p-4 border border-dashed border-border text-center">No proposals found for this client.</p>
            )}
          </section>

          {/* Contracts */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-brand" />
                Contracts
              </h2>
            </div>
            {contracts && contracts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {contracts.map((c) => (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-dark">{c.contract_type.replace('_', ' ')}</p>
                        <p className="text-xs text-mid mt-1">
                          {c.signed_at 
                            ? `Signed on ${format(new Date(c.signed_at), "MMM d, yyyy")}` 
                            : "Awaiting signature"}
                        </p>
                      </div>
                      <Badge variant={c.status === 'signed' ? 'success' : 'surface'}>
                        {c.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mid bg-surface p-4 border border-dashed border-border text-center">No contracts found for this client.</p>
            )}
          </section>

          {/* Invoices */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand" />
                Invoices
              </h2>
            </div>
            {invoices && invoices.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {invoices.map((i) => (
                  <Card key={i.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-dark">{i.invoice_number}</p>
                        <p className="text-xs text-mid mt-1">
                          Due {format(new Date(i.due_date), "MMM d, yyyy")} • {formatCurrency(i.total, i.currency)}
                        </p>
                      </div>
                      <Badge variant={i.status === 'paid' ? 'success' : i.status === 'overdue' ? 'error' : 'surface'}>
                        {i.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mid bg-surface p-4 border border-dashed border-border text-center">No invoices found for this client.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
