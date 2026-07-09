import { CheckoutButton } from "@/components/checkout-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSubscribed } from "@/features/subscriptions/data";
import { verifySession } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function DashboardPage() {
  const session = await verifySession();
  const subscribed = await isSubscribed(session.user.id);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {session.user.name}</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Badge variant={subscribed ? "default" : "secondary"}>{subscribed ? "Pro" : "Free"}</Badge>
          {!subscribed && <CheckoutButton configured={!!env.STRIPE_PRICE_ID} />}
        </CardContent>
      </Card>
    </div>
  );
}
