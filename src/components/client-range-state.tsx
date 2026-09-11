"use client";
import {
  createContext,
  useState,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from "react";

export const ClientRangeContext = createContext<{
  pending: boolean;
  startTransition: TransitionStartFunction;
  requested: string | null;
  setRequested: (value: string) => void;
} | null>(null);

export function ClientRangeProvider({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  const [requested, setRequested] = useState<string | null>(null);
  return (
    <ClientRangeContext.Provider
      value={{ pending, startTransition, requested, setRequested }}
    >
      {children}
    </ClientRangeContext.Provider>
  );
}
