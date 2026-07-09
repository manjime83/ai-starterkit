import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { headers } from "next/headers";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">{APP_NAME}</h1>
      <p className="text-muted-foreground">Build your SaaS faster.</p>
      <Link href={session ? "/dashboard" : "/sign-in"} className={buttonVariants({ size: "lg" })}>
        {session ? "Go to Dashboard" : "Get Started"}
      </Link>
    </main>
  );
}
