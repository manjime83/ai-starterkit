"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export function CheckoutButton({ configured = true }: { configured?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!configured) {
      toast.error("Billing is not configured");
      return;
    }
    setLoading(true);
    const { error } = await authClient.subscription.upgrade({
      plan: "pro",
      successUrl: "/dashboard/settings?checkout=success",
      cancelUrl: "/dashboard/settings",
    });
    if (error) {
      toast.error(error.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? "Redirecting..." : "Upgrade to Pro"}
    </Button>
  );
}
