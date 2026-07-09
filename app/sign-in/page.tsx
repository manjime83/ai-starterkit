"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/constants";
import { useState } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleGoogleSignIn() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/dashboard" });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Failed to send magic link");
    } else {
      setSent(true);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        {sent ? (
          <p className="text-center text-sm">Check your email for a sign-in link.</p>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">or</span>
              </div>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send magic link"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
