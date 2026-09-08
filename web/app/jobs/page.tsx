"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import JobCard from "@/components/JobCard";
import type { Job } from "@/lib/jobs";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(data.jobs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount, no data layer in this app
    load();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Inzeráty</h1>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-card px-3 py-1.5 text-sm font-medium text-text-muted transition hover:border-accent/40 hover:text-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Obnovit
        </button>
      </div>

      {loading && <p className="text-sm text-text-subtle">Načítám…</p>}

      {!loading && jobs.length === 0 && (
        <p className="text-sm text-text-muted">
          Zatím žádné inzeráty. Přidej první v sekci{" "}
          <a href="/job-descriptions" className="text-accent underline">
            Popisy pozic
          </a>
          .
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.slug} job={job} />
        ))}
      </div>
    </div>
  );
}
