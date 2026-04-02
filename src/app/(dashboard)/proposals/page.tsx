"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Plus, Search, FileText, ChevronRight, Eye, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchProposals();
  }, []);

  async function fetchProposals() {
    const { data, error } = await supabase
      .from("proposals")
      .select("*, client:clients(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load proposals", variant: "destructive" });
    } else {
      setProposals(data || []);
    }
    setLoading(false);
  }

  const filteredProposals = proposals.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.client?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'surface';
      case 'sent': return 'brand';
      case 'viewed': return 'accent';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'surface';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark tracking-tight">Proposals</h1>
          <p className="text-mid">Track your winning pipeline and active pitches.</p>
        </div>
        <Link href="/proposals/new/edit">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Proposal
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid" />
          <Input 
            placeholder="Search proposals..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-none border-none bg-transparent">
        <CardContent className="p-0 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-mid">Loading proposals...</div>
          ) : filteredProposals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredProposals.map((proposal) => (
                <Link 
                  key={proposal.id} 
                  href={`/proposals/${proposal.id}/edit`}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-border hover:border-brand transition-all"
                >
                  <div className="flex-1 min-w-0 mr-8">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-brand">{proposal.client?.name}</span>
                      <Badge variant={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-dark group-hover:text-brand transition-colors truncate">
                      {proposal.title}
                    </h3>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center gap-8 text-sm">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 text-mid mb-1">
                        <DollarSign className="w-3 h-3" />
                        Value
                      </div>
                      <span className="font-bold text-dark">{formatCurrency(proposal.total_price, proposal.currency)}</span>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 text-mid mb-1">
                        <Calendar className="w-3 h-3" />
                        Sent
                      </div>
                      <span className="text-dark">
                        {proposal.sent_at ? format(new Date(proposal.sent_at), "MMM d") : "—"}
                      </span>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-border group-hover:text-brand group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-border flex flex-col items-center">
              <FileText className="w-12 h-12 text-mid opacity-20 mb-4" />
              <p className="text-mid font-medium">No proposals found.</p>
              <Link href="/proposals/new/edit" className="mt-4">
                <Button variant="outline">Create your first proposal</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
