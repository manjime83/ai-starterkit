import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted-foreground text-lg">Replace this tagline with what your product does.</p>
      {session ? (
        <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
          Go to Dashboard
        </Link>
      ) : (
        <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }))}>
          Get Started
        </Link>
      )}
    </main>
  );
}
