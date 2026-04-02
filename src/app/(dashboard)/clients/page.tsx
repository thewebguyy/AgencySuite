"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  User, 
  Mail, 
  Phone, 
  Globe,
  Archive
} from "lucide-react";
import { 
  Modal, 
  ModalContent, 
  ModalDescription, 
  ModalFooter, 
  ModalHeader, 
  ModalTitle 
} from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch clients", variant: "destructive" });
    } else {
      setClients(data || []);
    }
    setIsLoading(false);
  }

  const archiveClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ is_archived: true })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Client archived" });
      fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const onSubmit = async (values: ClientFormValues) => {
    try {
      // In the client, we can't easily get the agency ID without a query or context
      // Since Proplo is 1 agency per Org, we can fetch the current agency
      const { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .select("id")
        .single();
      
      if (agencyError || !agency) throw new Error("Failed to identify your agency. Please refresh.");

      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update(values)
          .eq("id", editingClient.id);
        if (error) throw error;
        toast({ title: "Success", description: "Client updated" });
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ ...values, agency_id: agency.id });
        if (error) throw error;
        toast({ title: "Success", description: "Client added" });
      }

      setIsModalOpen(false);
      setEditingClient(null);
      reset();
      fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark tracking-tight">Clients</h1>
          <p className="text-mid">Manage your client relationships and project history.</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingClient(null); reset(); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid" />
          <Input 
            placeholder="Search clients..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-mid">Loading clients...</div>
          ) : filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-mid uppercase tracking-widest">Client / Company</th>
                    <th className="px-6 py-4 text-xs font-semibold text-mid uppercase tracking-widest">Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold text-mid uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-mid uppercase tracking-widest">Added</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-surface/50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/clients/${client.id}`} className="block">
                          <p className="font-semibold text-dark hover:text-brand transition-colors">{client.name}</p>
                          <p className="text-sm text-mid">{client.company || "No Company"}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm text-dark">
                          <span className="flex items-center gap-2"><Mail className="w-3 h-3 text-mid" /> {client.email}</span>
                          {client.phone && <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-mid" /> {client.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-mid">
                        <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> {client.country || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-mid">
                        {format(new Date(client.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setEditingClient(client);
                                reset(client);
                                setIsModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-mid hover:text-red-400 transition-colors"
                              onClick={() => {
                                if (confirm("Archive this client? All project history will be preserved.")) {
                                  archiveClient(client.id);
                                }
                              }}
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-mid">
              <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No clients found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{editingClient ? "Edit Client" : "Add New Client"}</ModalTitle>
            <ModalDescription>Enter the client's information to manage their project history.</ModalDescription>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" {...register("name")} error={errors.name?.message} />
              <Input label="Company" {...register("company")} error={errors.company?.message} />
            </div>
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" {...register("phone")} error={errors.phone?.message} />
              <Input label="Country" {...register("country")} error={errors.country?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mid uppercase tracking-wider">Notes</label>
              <textarea 
                {...register("notes")} 
                className="flex min-h-[80px] w-full rounded-none border border-border bg-white px-3 py-2 text-sm text-dark focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingClient ? "Save Changes" : "Add Client"}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
