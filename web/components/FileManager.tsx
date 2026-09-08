"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilePlus, Pencil, Save, Search, Trash2 } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

interface FileInfo {
  name: string;
  size: number;
  mtime: string;
}

interface FileManagerProps {
  apiBase: string;
  title: string;
  newFileTemplate?: (name: string) => string;
  initialSelect?: string;
}

function formatRelativeTime(timestamp: number, now: number): string {
  const diffMs = now - timestamp;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.round(hours / 24);
  return `před ${days} d`;
}

export default function FileManager({ apiBase, title, newFileTemplate, initialSelect }: FileManagerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const refreshList = useCallback(async () => {
    const res = await fetch(apiBase);
    const data = await res.json();
    setFiles(data.files ?? []);
  }, [apiBase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount, no data layer in this app
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (initialSelect) selectFile(initialSelect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelect]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function selectFile(name: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba při načítání souboru");
      setSelected(name);
      setContent(data.content);
      setOriginal(data.content);
      setSavedAt(null);
      setEditingName(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(selected)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Uložení selhalo");
      setOriginal(content);
      setSavedAt(Date.now());
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function createFile() {
    const name = window.prompt("Název nového souboru (např. novy_soubor.md):");
    if (!name) return;
    const finalName = name.endsWith(".md") ? name : `${name}.md`;
    setError(null);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          content: newFileTemplate ? newFileTemplate(finalName) : `# ${finalName.replace(/\.md$/, "")}\n\n`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vytvoření souboru selhalo");
      await refreshList();
      await selectFile(finalName);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function renameTo(newName: string) {
    if (!selected || !newName || newName === selected) {
      setEditingName(false);
      return;
    }
    const finalName = newName.endsWith(".md") ? newName : `${newName}.md`;
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(selected)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: finalName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Přejmenování selhalo");
      await refreshList();
      setSelected(finalName);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEditingName(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    if (!window.confirm(`Opravdu smazat „${selected}“? Tuto akci nelze vrátit zpět.`)) return;
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(selected)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Smazání selhalo");
      setSelected(null);
      setContent("");
      setOriginal("");
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function startEditingName() {
    if (!selected) return;
    setNameDraft(selected);
    setEditingName(true);
    requestAnimationFrame(() => nameInputRef.current?.select());
  }

  const dirty = content !== original;

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

  return (
    <div className="flex h-full min-h-0 gap-6">
      <aside className="flex w-[300px] shrink-0 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <span className="text-xs text-text-subtle">{files.length}</span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat…"
            className="w-full rounded-lg border border-border-subtle bg-card py-1.5 pr-2 pl-8 text-sm text-text-primary placeholder:text-text-subtle focus:border-accent focus:outline-none"
          />
        </div>

        <button
          onClick={createFile}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-[0_4px_14px_0_rgba(99,102,241,0.35)] transition hover:bg-accent-hover"
        >
          <FilePlus className="h-4 w-4" /> Nový soubor
        </button>

        <ul className="flex flex-1 flex-col gap-1.5 overflow-auto">
          {filteredFiles.map((f) => {
            const active = selected === f.name;
            return (
              <li key={f.name}>
                <button
                  onClick={() => selectFile(f.name)}
                  className={`group relative w-full overflow-hidden rounded-lg border py-2 pr-3 pl-3 text-left transition ${
                    active
                      ? "border-accent/30 bg-accent-soft"
                      : "border-border-subtle bg-card hover:border-accent/30"
                  }`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1 rounded-r-full transition ${
                      active ? "bg-accent" : "bg-transparent group-hover:bg-border-subtle"
                    }`}
                  />
                  <span className={`block truncate text-sm font-medium ${active ? "text-accent" : "text-text-primary"}`}>
                    {f.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-text-subtle">
                    Upraveno {formatRelativeTime(new Date(f.mtime).getTime(), now)}
                  </span>
                </button>
              </li>
            );
          })}
          {filteredFiles.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-text-subtle">
              {search ? "Žádné odpovídající soubory" : "Žádné soubory"}
            </li>
          )}
        </ul>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
        {!selected && !loading && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border-subtle text-sm text-text-subtle">
            Vyber soubor vlevo, nebo vytvoř nový.
          </div>
        )}
        {selected && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-border-subtle bg-card px-4 py-2.5 shadow-sm">
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={() => renameTo(nameDraft)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameTo(nameDraft);
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    autoFocus
                    className="w-full rounded-md border border-accent bg-background px-2 py-1 text-sm font-medium text-text-primary focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={startEditingName}
                    title="Kliknutím upravíš název"
                    className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md px-2 py-1 text-sm font-medium text-text-primary hover:bg-surface"
                  >
                    <span className="truncate">{selected}</span>
                    <Pencil className="h-3 w-3 shrink-0 text-text-subtle" />
                  </button>
                )}
              </div>
              <span className="shrink-0 text-xs text-text-subtle">
                {dirty ? (
                  <span className="text-accent">Neuložené změny</span>
                ) : savedAt ? (
                  `Uloženo ${formatRelativeTime(savedAt, now)}`
                ) : (
                  ""
                )}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={deleteSelected}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-text-muted transition hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Smazat
                </button>
                <button
                  onClick={save}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground shadow-[0_4px_14px_0_rgba(99,102,241,0.35)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? "Ukládám…" : "Uložit"}
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 rounded-xl border border-border-subtle bg-card p-3 shadow-sm">
              <MarkdownEditor value={content} onChange={setContent} height="100%" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
