"use client";
import Link from "next/link";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <section className="results-retry" role="alert">
      <h2>Your results couldn’t load</h2>
      <p>Please try again. You can still use the navigation.</p>
      <button onClick={reset}>Retry</button>
      <Link href="/">Return to sign in</Link>
    </section>
  );
}
