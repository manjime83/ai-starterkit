"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CheckoutButton() {
  const [pending, setPending] = useState(false);

  async function upgrade() {
    setPending(true);
    const { error } = await authClient.subscription.upgrade({
      plan: "pro", // matches the plan name in lib/auth.ts
      successUrl: "/dashboard/settings?checkout=success",
      cancelUrl: "/dashboard/settings",
    });
    if (error) {
      toast.error(error.message ?? "Could not start checkout");
      setPending(false);
    }
  }

  return (
    <Button onClick={upgrade} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Upgrade to Pro
    </Button>
  );
}
