"use client";

import Link from "next/link";
import { FileText, FileCheck2 } from "lucide-react";
import type { Job } from "@/lib/jobs";

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-success-soft text-success" : "bg-surface text-text-subtle"
      }`}
    >
      {active ? <FileCheck2 className="mr-1 inline h-3 w-3" /> : <FileText className="mr-1 inline h-3 w-3" />}
      {label}
    </span>
  );
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${encodeURIComponent(job.slug)}`}
      className="group flex flex-col gap-3 rounded-xl border border-border-subtle bg-card p-4 shadow-sm transition hover:border-accent/40 hover:shadow-md"
    >
      <span className="truncate text-sm font-semibold text-text-primary group-hover:text-accent">{job.slug}</span>
      <div className="flex flex-wrap gap-1.5">
        <Badge label="CV" active={job.outputs.cvMd.exists} />
        <Badge label="CV PDF" active={job.outputs.cvPdf.exists} />
        <Badge label="CV EN" active={job.outputs.cvMdEn.exists} />
        <Badge label="Dopis" active={job.outputs.letterMd.exists} />
        <Badge label="Dopis PDF" active={job.outputs.letterPdf.exists} />
        <Badge label="Dopis EN" active={job.outputs.letterMdEn.exists} />
      </div>
    </Link>
  );
}
