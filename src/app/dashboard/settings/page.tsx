import { CheckoutButton } from "@/components/checkout-button";
import { ManageSubscriptionButton } from "@/components/manage-subscription-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { getSubscription } from "@/features/subscriptions/data";
import { verifySession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await verifySession();
  const subscription = await getSubscription(session.user.id);
  const subscribed = subscription?.status === "active";

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Name: </span>
            {session.user.name}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Email: </span>
            {session.user.email}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Badge variant={subscribed ? "default" : "secondary"}>{subscribed ? "Pro" : "Free"}</Badge>
          {subscribed ? <ManageSubscriptionButton /> : <CheckoutButton configured={!!env.STRIPE_PRICE_ID} />}
        </CardContent>
      </Card>
    </div>
  );
}
