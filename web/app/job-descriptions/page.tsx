"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FileManager from "@/components/FileManager";

function JobDescriptionsFileManager() {
  const searchParams = useSearchParams();
  const file = searchParams.get("file") ?? undefined;

  return (
    <div className="min-h-0 flex-1">
      <FileManager
        apiBase="/api/files/job-descriptions"
        title="Inzeráty"
        initialSelect={file}
        newFileTemplate={(name) =>
          `# ${name.replace(/\.md$/, "")}\n\n## Popis pozice\n\n## Požadavky\n\n## Nabízíme\n`
        }
      />
    </div>
  );
}

export default function JobDescriptionsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-4 shrink-0 text-lg font-semibold">Popisy pozic</h1>
      <Suspense fallback={<p className="text-sm text-text-subtle">Načítám…</p>}>
        <JobDescriptionsFileManager />
      </Suspense>
    </div>
  );
}
