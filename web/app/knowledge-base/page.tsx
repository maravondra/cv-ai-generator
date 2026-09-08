"use client";

import FileManager from "@/components/FileManager";

export default function KnowledgeBasePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-4 shrink-0 text-lg font-semibold">Znalostní báze</h1>
      <div className="min-h-0 flex-1">
        <FileManager apiBase="/api/files/knowledge-base" title="Podklady" />
      </div>
    </div>
  );
}
