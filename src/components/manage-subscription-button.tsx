"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    await authClient.customer.portal();
    setLoading(false);
  }

  return (
    <Button variant="outline" onClick={handlePortal} disabled={loading}>
      {loading ? "Redirecting..." : "Manage subscription"}
    </Button>
  );
}
