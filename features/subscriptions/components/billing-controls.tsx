import { Badge } from "@/components/ui/badge";
import { getSubscription, stripeEnabled } from "@/lib/auth";
import { CheckoutButton } from "./checkout-button";
import { ManageSubscriptionButton } from "./manage-subscription-button";

// Rendered by both the dashboard subscription card and the settings Billing section.
// Never offer Upgrade to an already-subscribed user — a second `upgrade` call creates
// a second Stripe subscription (STACK.md gotcha #6).
export async function BillingControls() {
  const subscribed = Boolean(await getSubscription());

  return (
    <div className="flex items-center gap-4">
      <Badge variant={subscribed ? "default" : "secondary"}>{subscribed ? "Pro" : "Free"}</Badge>
      {stripeEnabled ? subscribed ? <ManageSubscriptionButton /> : <CheckoutButton /> : null}
    </div>
  );
}
