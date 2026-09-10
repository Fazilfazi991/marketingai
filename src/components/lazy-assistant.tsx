"use client";
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bot, X } from "lucide-react";
import type { ClientResultsData } from "@/lib/client-results";

const Assistant = lazy(() =>
  import("./growth-ai-assistant").then((module) => ({
    default: module.GrowthAiAssistant,
  })),
);
class AssistantBoundary extends Component<
  { children: ReactNode; close: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <aside
        className="growth-ai-panel"
        role="dialog"
        aria-label="Assistant unavailable"
      >
        <header>
          Assistant unavailable
          <button
            type="button"
            onClick={this.props.close}
            aria-label="Close assistant"
          >
            <X />
          </button>
        </header>
        <p>Please check your connection.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload page to retry
        </button>
      </aside>
    ) : (
      this.props.children
    );
  }
}
export function LazyAssistant({ data }: { data: ClientResultsData }) {
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }, []);
  return (
    <>
      <div className="assistant-dock">
        {!open && (
          <button
            ref={launcher}
            className="growth-ai-launcher"
            type="button"
            aria-label="Ask Growth1000 AI"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Bot size={23} />
            <span>Ask Growth1000 AI</span>
          </button>
        )}
      </div>
      {open && (
        <AssistantBoundary close={close}>
          <Suspense
            fallback={
              <aside
                className="growth-ai-panel"
                role="dialog"
                aria-label="Growth1000 AI assistant"
              >
                <header>
                  <b>Opening assistant…</b>
                  <button
                    type="button"
                    aria-label="Close assistant"
                    onClick={close}
                  >
                    <X />
                  </button>
                </header>
                <p role="status">Loading your assistant…</p>
              </aside>
            }
          >
            <Assistant data={data} initialOpen onClose={close} />
          </Suspense>
        </AssistantBoundary>
      )}
    </>
  );
}
