"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  bold,
  italic,
  strikethrough,
  title,
  divider,
  link,
  image,
  unorderedListCommand,
  orderedListCommand,
  checkedListCommand,
  quote,
  code,
  codeBlock,
  table,
  hr,
  type ICommand,
} from "@uiw/react-md-editor/commands";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const TOOLBAR_COMMANDS: ICommand[] = [
  title,
  bold,
  italic,
  strikethrough,
  divider,
  link,
  image,
  divider,
  unorderedListCommand,
  orderedListCommand,
  checkedListCommand,
  quote,
  divider,
  code,
  codeBlock,
  table,
  hr,
];

type ViewMode = "write" | "split" | "preview";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "write", label: "Zápis" },
  { key: "split", label: "Rozdělené" },
  { key: "preview", label: "Náhled" },
];

const PREVIEW_BY_MODE: Record<ViewMode, "edit" | "live" | "preview"> = {
  write: "edit",
  split: "live",
  preview: "preview",
};

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
}

export default function MarkdownEditor({ value, onChange, height = 560 }: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ViewMode>("split");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- avoid rendering theme-dependent editor before hydration
    setMounted(true);
  }, []);

  const colorMode = mounted && resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="flex h-full flex-col gap-2" data-color-mode={colorMode}>
      <div className="inline-flex w-fit shrink-0 rounded-lg border border-border-subtle bg-surface p-0.5">
        {VIEW_MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              mode === m.key ? "bg-card text-accent shadow-sm" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <MDEditor
          value={value}
          onChange={(v) => onChange(v ?? "")}
          height={height}
          preview={PREVIEW_BY_MODE[mode]}
          visibleDragbar={false}
          commands={TOOLBAR_COMMANDS}
          extraCommands={[]}
        />
      </div>
    </div>
  );
}
