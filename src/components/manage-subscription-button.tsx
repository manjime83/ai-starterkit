"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    const { error } = await authClient.subscription.billingPortal({
      returnUrl: "/dashboard/settings",
    });
    if (error) {
      toast.error(error.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handlePortal} disabled={loading}>
      {loading ? "Redirecting..." : "Manage subscription"}
    </Button>
  );
}
