"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/use-toast";

interface Props {
  proposalId: string;
  agencyColor: string;
}

export function AcceptProposalButtons({ proposalId, agencyColor }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/accept`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to accept");

      toast({ 
        title: "Proposal Accepted!", 
        description: "Moving to the contract phase.",
        variant: "success"
      });

      // Redirect to the contract signing page
      router.push(`/contracts/sign/${data.contractToken}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Button variant="outline" className="border-border text-dark">
        Request Changes
      </Button>
      <Button 
        className="px-12 py-6 text-lg font-bold" 
        style={{ backgroundColor: agencyColor }}
        onClick={handleAccept}
        disabled={loading}
      >
        {loading ? "Processing..." : "Accept Proposal"}
      </Button>
    </div>
  );
}
