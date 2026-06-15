"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export function CheckoutButton({ productId }: { productId?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!productId) {
      toast.error("Billing is not configured");
      return;
    }
    setLoading(true);
    await authClient.checkout({ products: productId });
    setLoading(false);
  }

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? "Redirecting..." : "Upgrade to Pro"}
    </Button>
  );
}
