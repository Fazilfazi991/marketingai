import { SignInButton } from "@/components/submit-button";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { isDemoMode } from "@/lib/demo-mode";
import { signIn } from "./auth/actions";
const roles = [
  {
    name: "Demo Admin",
    desc: "Run clients, deliverables and approvals",
    href: "/admin",
    initials: "FA",
    tone: "purple",
  },
  {
    name: "Demo Staff",
    desc: "Schedule and publish approved content",
    href: "/staff",
    initials: "MS",
    tone: "orange",
  },
  {
    name: "Demo Client",
    desc: "View ABC Interiors workspace",
    href: "/client",
    initials: "AI",
    tone: "green",
  },
];
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams,
    demo = isDemoMode();
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div className="story-copy">
          <span className="overline">
            <Sparkles size={14} /> Internal growth operating system
          </span>
          <h1>One calm place to run every client promise.</h1>
          <p>
            Plan, create, approve and deliver digital growth work—without losing
            track of what matters next.
          </p>
          <div className="story-metrics">
            <div>
              <BarChart3 />
              <b>120</b>
              <span>deliverables tracked</span>
            </div>
            <div>
              <CalendarCheck2 />
              <b>98</b>
              <span>ready this month</span>
            </div>
            <div>
              <ShieldCheck />
              <b>3</b>
              <span>secure role views</span>
            </div>
          </div>
        </div>
        <div className="story-proof">
          <span className="proof-avatars">
            <i>F</i>
            <i>M</i>
            <i>O</i>
          </span>
          <span>
            <b>Built for the way your team works</b>
            <small>Clear ownership. Human approval. No noise.</small>
          </span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-box">
          {demo ? (
            <>
              <span className="demo-badge">Local demo mode</span>
              <h2>Welcome to Growth1000</h2>
              <p>Choose a role to explore the operating system.</p>
              <div className="role-list">
                {roles.map((role) => (
                  <Link href={role.href} key={role.href} className="role-card">
                    <span className={`role-avatar ${role.tone}`}>
                      {role.initials}
                    </span>
                    <span>
                      <b>{role.name}</b>
                      <small>{role.desc}</small>
                    </span>
                    <ArrowRight size={18} />
                  </Link>
                ))}
              </div>
              <div className="demo-note">
                <Check size={16} />
                <span>
                  Demo data only. No third-party accounts are connected.
                </span>
              </div>
              <p className="credential-note">
                Local password: <code>Growth1000Demo!</code>
                <br />
                Hidden automatically when demo mode is disabled.
              </p>
            </>
          ) : (
            <>
              <span className="demo-badge secure">
                <LockKeyhole size={12} /> Secure workspace
              </span>
              <h2>Sign in to Growth1000</h2>
              <p>
                Use the account invited to your organization or client
                workspace.
              </p>
              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}
              <form action={signIn} className="auth-form">
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
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
              <div className="demo-note">
                <ShieldCheck size={16} />
                <span>
                  Access is enforced by your account role and database row
                  policies.
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
