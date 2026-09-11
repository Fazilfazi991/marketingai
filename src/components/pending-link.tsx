"use client";
import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { createPortal } from "react-dom";

function PendingHint() {
  const { pending } = useLinkStatus();
  return pending ? (
    <>
      <span className="navigation-pending" aria-hidden="true">
        Opening…
      </span>
      {createPortal(
        <div className="route-transition-notice" role="status">
          Opening page…
        </div>,
        document.body,
      )}
    </>
  ) : null;
}
export function PendingLink({
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingHint />
    </Link>
  );
}
