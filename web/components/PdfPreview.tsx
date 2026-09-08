"use client";

import { Download, X } from "lucide-react";

interface PdfPreviewProps {
  slug: string;
  name: string;
  onClose: () => void;
}

export default function PdfPreview({ slug, name, onClose }: PdfPreviewProps) {
  const src = `/api/pdf?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}`;
  const downloadSrc = `${src}&download=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-full w-full max-w-4xl flex-col rounded-xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
          <span className="truncate text-sm font-medium text-text-primary">{name}</span>
          <div className="flex items-center gap-2">
            <a
              href={downloadSrc}
              className="inline-flex items-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-xs font-medium text-text-muted transition hover:border-accent/40 hover:text-accent"
            >
              <Download className="h-3.5 w-3.5" /> Stáhnout
            </a>
            <button onClick={onClose} className="rounded-md p-1 text-text-muted transition hover:bg-surface hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <iframe src={src} className="flex-1 rounded-b-lg" title={name} />
      </div>
    </div>
  );
}
