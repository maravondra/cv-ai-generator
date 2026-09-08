"use client";

import { useState } from "react";
import { Eye, Pencil, Save } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";
import PdfPreview from "./PdfPreview";
import ScriptRunner from "./ScriptRunner";
import type { OutputVariant } from "@/lib/jobs";

interface OutputDocPanelProps {
  slug: string;
  title: string;
  md: OutputVariant;
  pdf: OutputVariant;
  doc: "cv" | "letter";
  lang: "cs" | "en";
  onChanged: () => void;
}

export default function OutputDocPanel({ slug, title, md, pdf, doc, lang, onChanged }: OutputDocPanelProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openEditor() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/outputs/${encodeURIComponent(slug)}/${encodeURIComponent(md.name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba při načítání");
      setContent(data.content);
      setOriginal(data.content);
      setEditing(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/outputs/${encodeURIComponent(slug)}/${encodeURIComponent(md.name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Uložení selhalo");
      setOriginal(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const dirty = content !== original;

  if (!md.exists) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle p-4 text-sm text-text-subtle">
        {title} zatím nebyl vygenerován.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={editing ? save : openEditor}
            disabled={loading || saving || (editing && !dirty)}
            className="inline-flex items-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-text-muted transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? (
              <>
                <Save className="h-3.5 w-3.5" /> {saving ? "Ukládám…" : "Uložit"}
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" /> {loading ? "Načítám…" : "Upravit"}
              </>
            )}
          </button>
          <ScriptRunner
            label="Vykreslit PDF"
            endpoint="/api/render/pdf"
            body={{ slug, doc, lang }}
            variant="secondary"
            onDone={(ok) => ok && onChanged()}
          />
          {pdf.exists && (
            <button
              onClick={() => setShowPdf(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-text-muted transition hover:border-accent/40 hover:text-accent"
            >
              <Eye className="h-3.5 w-3.5" /> Zobrazit PDF
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {editing && <MarkdownEditor value={content} onChange={setContent} height={420} />}

      {showPdf && <PdfPreview slug={slug} name={pdf.name} onClose={() => setShowPdf(false)} />}
    </div>
  );
}
