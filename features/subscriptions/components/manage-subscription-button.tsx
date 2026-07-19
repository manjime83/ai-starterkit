"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ManageSubscriptionButton() {
  const [pending, setPending] = useState(false);

  async function openBillingPortal() {
    setPending(true);
    const { error } = await authClient.subscription.billingPortal({
      returnUrl: "/dashboard/settings",
    });
    if (error) {
      toast.error(error.message ?? "Could not open the billing portal");
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={openBillingPortal} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Manage subscription
    </Button>
  );
}
