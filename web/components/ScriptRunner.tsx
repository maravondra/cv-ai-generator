"use client";

import { useRef, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";

const DONE_PREFIX = "__SCRIPT_DONE__:";

interface ScriptRunnerProps {
  label: string;
  endpoint: string;
  body: Record<string, unknown>;
  disabled?: boolean;
  onDone?: (success: boolean) => void;
  variant?: "primary" | "secondary";
}

export default function ScriptRunner({
  label,
  endpoint,
  body,
  disabled,
  onDone,
  variant = "primary",
}: ScriptRunnerProps) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string>("");
  const [showLog, setShowLog] = useState(false);
  const [failed, setFailed] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  async function run() {
    setRunning(true);
    setFailed(false);
    setLog("");
    setShowLog(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setLog((prev) => prev + `\n❌ ${data.error || `HTTP ${res.status}`}\n`);
        setFailed(true);
        setRunning(false);
        onDone?.(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let success = true;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const doneIdx = buffer.indexOf(DONE_PREFIX);
        if (doneIdx !== -1) {
          const before = buffer.slice(0, doneIdx);
          if (before) setLog((prev) => prev + before);
          const rest = buffer.slice(doneIdx + DONE_PREFIX.length);
          const code = parseInt(rest, 10);
          success = code === 0;
          buffer = "";
        } else {
          setLog((prev) => prev + buffer);
          buffer = "";
        }
        requestAnimationFrame(() => {
          logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
        });
      }

      setFailed(!success);
      onDone?.(success);
    } catch (err) {
      setLog((prev) => prev + `\n❌ ${err instanceof Error ? err.message : String(err)}\n`);
      setFailed(true);
      onDone?.(false);
    } finally {
      setRunning(false);
    }
  }

  const buttonClasses =
    variant === "primary"
      ? "bg-accent text-accent-foreground shadow-[0_4px_14px_0_rgba(99,102,241,0.35)] hover:bg-accent-hover disabled:shadow-none"
      : "bg-surface text-text-primary border border-border-subtle hover:border-accent/40 hover:text-accent";

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={run}
        disabled={disabled || running}
        className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClasses}`}
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
        {label}
      </button>
      {showLog && (
        <pre
          ref={logRef}
          className={`max-h-56 overflow-auto rounded-md border p-2 font-mono text-xs whitespace-pre-wrap ${
            failed ? "border-danger/30 bg-danger-soft text-danger" : "border-border-subtle bg-slate-950 text-slate-100"
          }`}
        >
          {log || "…"}
        </pre>
      )}
    </div>
  );
}
