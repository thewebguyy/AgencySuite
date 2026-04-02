"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  FileText, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  Clock,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Deliverable {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Phase {
  phaseName: string;
  durationWeeks: number;
  milestones: string[];
}

export default function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  
  // Data State
  const [title, setTitle] = useState("Untitled Proposal");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("draft");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [scopeStatement, setScopeStatement] = useState("");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [outOfScope, setOutOfScope] = useState<string[]>([]);
  
  // Creation States
  const [brief, setBrief] = useState("");
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(0);
  const [timelineWeeks, setTimelineWeeks] = useState(4);

  const [agency, setAgency] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  async function fetchInitialData() {
    // Fetch Agency
    const { data: agencyData } = await supabase.from("agencies").select("*").single();
    setAgency(agencyData);
    
    // Fetch Clients
    const { data: clientsData } = await supabase.from("clients").select("id, name, company");
    setClients(clientsData || []);

    if (id !== "new") {
      await fetchProposal();
    } else {
      setLoading(false);
    }
  }

  async function fetchProposal() {
    const { data, error } = await supabase
      .from("proposals")
      .select("*, proposal_items(*), proposal_phases(*)")
      .eq("id", id)
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to load proposal", variant: "destructive" });
    } else {
      setTitle(data.title);
      setClientId(data.client_id);
      setStatus(data.status);
      setExecutiveSummary(data.executive_summary || "");
      setScopeStatement(data.scope_statement || "");
      setDeliverables(data.proposal_items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unit_price
      })));
      setPhases(data.proposal_phases.sort((a: any, b: any) => a.sort_order - b.sort_order) || []);
      setAssumptions(data.assumptions || []);
      setOutOfScope(data.out_of_scope || []);
    }
    setLoading(false);
  }

  const handleGenerate = async () => {
    if (brief.length < 50) {
      toast({ title: "Brief too short", description: "Please provide a more detailed brief (min 50 chars).", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setExecutiveSummary("");
    
    try {
      const response = await fetch("/api/ai/generate-proposal", {
        method: "POST",
        body: JSON.stringify({
          brief,
          budgetMin,
          budgetMax,
          timelineWeeks,
          currency: "USD",
          agencyName: agency?.name || "Your Agency",
          specializations: agency?.specializations || []
        }),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") break;
            try {
              const data = JSON.parse(dataStr);
              if (data.isPostProcess) {
                const { proposal, pricesAdjusted, timelineScaled } = data;
                setExecutiveSummary(proposal.executiveSummary);
                setScopeStatement(proposal.scopeStatement);
                setDeliverables(proposal.deliverables.map((d: any, i: number) => ({ ...d, id: `temp-${i}` })));
                setPhases(proposal.phases);
                setAssumptions(proposal.assumptions);
                setOutOfScope(proposal.outOfScope);
                
                if (pricesAdjusted) {
                  toast({
                    title: "Prices Adjusted",
                    description: "Prices adjusted to fit your stated budget range. Review deliverable pricing.",
                    variant: "warning"
                  });
                }
                if (timelineScaled) {
                  toast({
                    title: "Timeline Scaled",
                    description: `Timeline scaled proportionally to fit your ${timelineWeeks}-week limit.`,
                    variant: "warning"
                  });
                }
              } else if (data.text) {
                fullContent += data.text;
                setExecutiveSummary(prev => prev + data.text);
              }
            } catch (e) {}
          }
        }
      }

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async (action: string) => {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/refine-proposal", {
        method: "POST",
        body: JSON.stringify({
          action,
          currentData: { executiveSummary, phases, scopeStatement, deliverables }
        })
      });

      if (!response.ok) throw new Error("Refinement failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
           if (line.trim().startsWith("data: ")) {
             const dataStr = line.replace("data: ", "").trim();
             if (dataStr === "[DONE]") break;
             try {
               const { text } = JSON.parse(dataStr);
               fullText += text;
               if (action === "shorten-summary") setExecutiveSummary(prev => prev + text);
             } catch(e) {}
           }
        }
      }

      if (action === "add-buffer") {
        setPhases(JSON.parse(fullText.substring(fullText.indexOf('['), fullText.lastIndexOf(']') + 1)));
      } else if (action === "suggest-assumptions") {
        const newAssumptions = JSON.parse(fullText.substring(fullText.indexOf('['), fullText.lastIndexOf(']') + 1));
        setAssumptions(prev => [...prev, ...newAssumptions]);
      } else if (action === "shorten-summary") {
        setExecutiveSummary(fullText);
      }
      
      toast({ title: "Refinement Complete", description: "AI has updated your proposal." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  const handleSave = async (statusOverride?: string) => {
    if (!clientId) {
      toast({ title: "Client Required", description: "Please select a client before saving.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/proposals/save", {
        method: "POST",
        body: JSON.stringify({
          id,
          clientId,
          title,
          executiveSummary,
          scopeStatement,
          deliverables,
          phases,
          assumptions,
          outOfScope,
          totalPrice,
          currency: "USD",
          status: statusOverride || status
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to save");

      toast({ title: "Saved", description: "Proposal draft saved successfully." });
      
      if (id === "new") {
        router.replace(`/proposals/${resData.id}/edit`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (id === 'new') {
      toast({ title: "Save First", description: "Please save your proposal before sending.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/proposals/${id}/send`, { method: "POST" });
      const resData = await response.json();
      
      if (!response.ok) throw new Error(resData.error || "Failed to send");

      toast({ title: "Sent!", description: "Proposal has been sent to the client.", variant: "success" });
      await fetchProposal();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const totalPrice = deliverables.reduce((acc, d) => acc + (d.quantity * d.unitPrice), 0);

  if (loading) return <div className="p-8">Loading editor...</div>;

  return (
    <div className="flex h-[calc(100vh-120px)] -m-8 overflow-hidden">
      {/* Left Panel: Brief / Assistant */}
      <div className="w-[300px] border-r border-border bg-surface/30 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-dark flex items-center gap-2 mb-4 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand" />
              AI Assistant
            </h2>
            
            {id === "new" && !executiveSummary ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-mid uppercase tracking-widest">Client Brief</label>
                  <textarea 
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Describe the project goals, requirements..."
                    className="flex min-h-[150px] w-full border border-border bg-white px-3 py-2 text-xs text-dark focus:outline-none focus:border-brand transition-colors"
                  />
                  <span className="text-[10px] text-mid text-right">{brief.length} chars</span>
                </div>
                
                <div className="space-y-4">
                  <Input 
                    label="Budget Range ($)" 
                    placeholder="e.g. 5000 - 10000"
                    onChange={(e) => {
                      const val = e.target.value.split('-').map(v => parseInt(v.trim()));
                      if (val.length === 2) {
                        setBudgetMin(val[0]);
                        setBudgetMax(val[1]);
                      }
                    }} 
                  />
                  <Input 
                    label="Timeline (Weeks)" 
                    type="number" 
                    value={timelineWeeks} 
                    onChange={(e) => setTimelineWeeks(Number(e.target.value))} 
                  />
                </div>
                
                <Button className="w-full gap-2 text-xs h-10" onClick={handleGenerate} disabled={generating}>
                  <Sparkles className="w-4 h-4" />
                  {generating ? "Brainstorming..." : "Generate Draft"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="bg-white border-brand/10 shadow-sm">
                  <CardContent className="p-3 space-y-3">
                    <p className="text-[10px] text-mid uppercase font-bold tracking-widest">Refinement Tools</p>
                    <div className="flex flex-col gap-1.5">
                      <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs font-medium" onClick={() => handleRefine('shorten-summary')} disabled={generating}>
                        <FileText className="w-3.5 h-3.5 text-mid" /> Summarize Concisely
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs font-medium" onClick={() => handleRefine('add-buffer')} disabled={generating}>
                        <Clock className="w-3.5 h-3.5 text-mid" /> Add Revision Buffer
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs font-medium" onClick={() => handleRefine('suggest-assumptions')} disabled={generating}>
                        <Briefcase className="w-3.5 h-3.5 text-mid" /> Suggest Assumptions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="p-4 bg-white/50 border border-border rounded-lg">
                  <label className="text-[9px] uppercase font-bold text-mid block mb-2 tracking-widest">Original Brief Reference</label>
                  <p className="text-xs text-mid leading-relaxed line-clamp-6 italic">"{brief}"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Panel: Editor */}
      <div className="flex-1 bg-white p-12 overflow-y-auto border-r border-border">
        <div className="max-w-3xl mx-auto space-y-12 pb-32">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project Title"
                className="text-4xl font-bold text-dark w-full border-b border-transparent hover:border-border/50 focus:border-brand/30 focus:outline-none transition-colors mb-4 placeholder:opacity-20"
              />
              <div className="flex items-center gap-4 text-sm">
                <Badge variant={status === 'draft' ? 'surface' : 'brand'}>{status}</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-mid whitespace-nowrap">Client:</span>
                  <select 
                    value={clientId} 
                    onChange={(e) => setClientId(e.target.value)}
                    className="font-medium text-dark bg-transparent border-none focus:ring-0 focus:outline-none cursor-pointer hover:text-brand transition-colors"
                  >
                    <option value="">Select a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.company && `(${c.company})`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                Preview PDF
              </Button>
              <Button className="gap-2" onClick={handleSend} disabled={sending || deliverables.length === 0}>
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : "Send to Client"}
              </Button>
            </div>
          </div>

          {/* Sections */}
          <section className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-mid">Executive Summary</h3>
             <textarea 
               value={executiveSummary}
               onChange={(e) => setExecutiveSummary(e.target.value)}
               className="w-full min-h-[120px] text-lg text-dark leading-relaxed focus:outline-none"
               placeholder="Briefly describe the vision for this project..."
             />
          </section>

          <section className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-mid">Scope of Work</h3>
             <textarea 
               value={scopeStatement}
               onChange={(e) => setScopeStatement(e.target.value)}
               className="w-full min-h-[100px] text-dark leading-relaxed focus:outline-none"
               placeholder="Outline the technical or creative scope..."
             />
          </section>

          {/* Deliverables Table */}
          <section className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-mid">Deliverables & Pricing</h3>
             <table className="w-full border-collapse">
               <thead>
                 <tr className="border-b border-border text-left">
                   <th className="py-3 text-xs font-semibold text-mid uppercase w-1/2">Item</th>
                   <th className="py-3 text-xs font-semibold text-mid uppercase text-center">Qty</th>
                   <th className="py-3 text-xs font-semibold text-mid uppercase text-right">Unit Price</th>
                   <th className="py-3 text-xs font-semibold text-mid uppercase text-right">Total</th>
                   <th className="w-10"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {deliverables.map((d, i) => (
                    <tr key={d.id} className="group">
                      <td className="py-4">
                        <input className="font-medium text-dark w-full focus:outline-none" value={d.title} onChange={(e) => {
                          const newD = [...deliverables];
                          newD[i].title = e.target.value;
                          setDeliverables(newD);
                        }} />
                        <input className="text-xs text-mid w-full mt-1 focus:outline-none" value={d.description} onChange={(e) => {
                          const newD = [...deliverables];
                          newD[i].description = e.target.value;
                          setDeliverables(newD);
                        }} />
                      </td>
                      <td className="py-4 text-center">
                        <input className="w-12 text-center text-sm focus:outline-none" type="number" value={d.quantity} onChange={(e) => {
                          const newD = [...deliverables];
                          newD[i].quantity = Number(e.target.value);
                          setDeliverables(newD);
                        }} />
                      </td>
                      <td className="py-4 text-right">
                         <input className="w-24 text-right text-sm focus:outline-none" type="number" value={d.unitPrice} onChange={(e) => {
                          const newD = [...deliverables];
                          newD[i].unitPrice = Number(e.target.value);
                          setDeliverables(newD);
                        }} />
                      </td>
                      <td className="py-4 text-right font-medium">
                        ${(d.quantity * d.unitPrice).toLocaleString()}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 p-1 h-auto text-mid hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
               </tbody>
               <tfoot>
                 <tr className="bg-surface/50 font-bold border-t-2 border-dark text-dark">
                   <td colSpan={3} className="py-4 px-4 text-right">Total Project Value</td>
                   <td className="py-4 text-right">${totalPrice.toLocaleString()}</td>
                   <td></td>
                 </tr>
               </tfoot>
             </table>
             <Button variant="outline" size="sm" className="gap-2" onClick={() => setDeliverables([...deliverables, { id: `new-${Date.now()}`, title: "New Item", description: "", quantity: 1, unitPrice: 0 }])}>
                <Plus className="w-4 h-4" /> Add Item
             </Button>
          </section>

          {/* Timeline Phases */}
          <section className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-mid">Project Phases</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {phases.map((phase, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <input className="font-bold text-dark focus:outline-none" value={phase.phaseName} onChange={(e) => {
                          const newP = [...phases];
                          newP[i].phaseName = e.target.value;
                          setPhases(newP);
                        }} />
                        <span className="text-xs bg-surface px-2 py-1 border border-border">{phase.durationWeeks} weeks</span>
                      </div>
                      <div className="space-y-1">
                        {phase.milestones.map((m, j) => (
                          <div key={j} className="flex items-center gap-2 text-sm text-mid">
                            <ChevronRight className="w-3 h-3" />
                            <input className="flex-1 focus:outline-none bg-transparent" value={m} onChange={(e) => {
                              const newP = [...phases];
                              newP[i].milestones[j] = e.target.value;
                              setPhases(newP);
                            }} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </section>

          {/* Footer Space Cleanup */}
          <div className="h-20" />
        </div>
      </div>

      {/* Right Panel: Version History Stub */}
      <div className="w-[280px] border-l border-border bg-surface/10 p-6 overflow-y-auto">
        <h2 className="text-[10px] font-bold text-mid uppercase tracking-widest mb-6">Version History</h2>
        <div className="space-y-4">
          <div className="p-3 bg-white border border-brand/20 rounded-lg shadow-sm">
             <div className="flex justify-between items-start mb-1">
               <span className="text-xs font-bold text-dark">Current Version</span>
               <Badge variant="brand" className="text-[9px] px-1 h-4">Active</Badge>
             </div>
             <p className="text-[10px] text-mid">Last saved moments ago</p>
          </div>
          
          <div className="p-3 border border-border/50 rounded-lg opacity-50 cursor-not-allowed grayscale">
             <div className="flex justify-between items-start mb-1">
               <span className="text-xs font-semibold text-dark">v1.1 - Sent</span>
               <span className="text-[9px] text-mid">2 hrs ago</span>
             </div>
             <p className="text-[10px] text-mid">Status: Sent to Client</p>
          </div>

          <div className="p-3 border border-border/50 rounded-lg opacity-50 cursor-not-allowed grayscale">
             <div className="flex justify-between items-start mb-1">
               <span className="text-xs font-semibold text-dark">v1.0 - Draft</span>
               <span className="text-[9px] text-mid">Yesterday</span>
             </div>
             <p className="text-[10px] text-mid">Initial AI generation</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border/50">
           <h3 className="text-[9px] font-bold text-mid uppercase tracking-widest mb-4">Export Options</h3>
           <div className="space-y-2">
             <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs border-dashed">
               <FileText className="w-3.5 h-3.5" /> Download PDF v1.1
             </Button>
           </div>
        </div>
      </div>

      {/* Persistent Footer */}
      <div className="fixed bottom-0 left-[300px] right-[280px] h-20 bg-white/90 backdrop-blur-md border-t border-border px-8 flex items-center justify-between z-30">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-mid tracking-widest leading-none">Status</span>
              <span className="text-sm font-semibold text-dark capitalize">{status}</span>
            </div>
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-mid tracking-widest leading-none">Total Investment</span>
              <span className="text-sm font-bold text-brand">${totalPrice.toLocaleString()}</span>
            </div>
         </div>
         <div className="flex gap-3">
            <Button variant="ghost" className="text-mid hover:text-dark text-xs" onClick={() => router.push('/proposals')}>Discard Changes</Button>
            <Button className="gap-2 px-6 h-11 shadow-lg shadow-brand/10" onClick={() => handleSave()} disabled={saving}>
              <Save className="w-4 h-4" /> 
              {saving ? "Saving..." : "Save Draft"}
            </Button>
         </div>
      </div>
    </div>
  );
}
