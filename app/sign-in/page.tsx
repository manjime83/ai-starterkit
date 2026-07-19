"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/constants";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  async function signInWithGoogle() {
    setPending(true);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    if (error) {
      toast.error(error.message ?? "Could not sign in with Google");
      setPending(false);
    }
  }

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/dashboard" });
    setPending(false);
    if (error) {
      toast.error(error.message ?? "Could not send the sign-in link");
      return;
    }
    setLinkSent(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to {APP_NAME}</CardTitle>
          <CardDescription>Use your Google account or get a sign-in link by email.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Button variant="outline" onClick={signInWithGoogle} disabled={pending}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            Continue with Google
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <Separator className="flex-1" />
          </div>
          {linkSent ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <MailCheck className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-muted-foreground text-sm">We sent a sign-in link to {email}.</p>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Send magic link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
