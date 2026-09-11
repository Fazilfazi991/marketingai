"use client";
import { useFormStatus } from "react-dom";
export function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="button"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
