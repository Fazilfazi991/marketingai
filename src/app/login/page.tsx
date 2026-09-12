import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { SignInButton } from "@/components/submit-button";
import { Wordmark } from "@/components/public-site/chrome";
import s from "@/components/public-site/public-site.module.css";
export const metadata: Metadata = {
  title: "Client Login | Gro",
  description: "Sign in to your Gro Growth Agent workspace.",
  robots: { index: false, follow: false },
  icons: { icon: "/gro-icon.svg", apple: "/gro-apple-icon" },
};
export default async function ClientLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className={`${s.site} ${s.loginPage}`}>
      <div className={s.loginCard}>
        <Wordmark />
        <h1>Welcome back to Gro</h1>
        <p>Sign in to your Growth Agent workspace.</p>
        {error && (
          <p className={s.loginError} role="alert">
            We couldn’t sign you in. Check your details and try again, or
            contact your Fusion Ventures team.
          </p>
        )}
        <form action={signIn} className={s.loginForm}>
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <SignInButton />
        </form>
        <Link href="/" className={s.textLink}>
          Back to Gro
        </Link>
      </div>
    </main>
  );
}
