"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import ScriptRunner from "@/components/ScriptRunner";
import OutputDocPanel from "@/components/OutputDocPanel";
import type { Job } from "@/lib/jobs";

export default function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = use(params);
  const slug = decodeURIComponent(rawSlug);

  const [job, setJob] = useState<Job | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const [jobRes, jdRes] = await Promise.all([
      fetch(`/api/jobs/${encodeURIComponent(slug)}`),
      fetch(`/api/files/job-descriptions/${encodeURIComponent(slug)}.md`),
    ]);
    if (!jobRes.ok) {
      setNotFound(true);
      return;
    }
    const jobData = await jobRes.json();
    setJob(jobData.job);
    if (jdRes.ok) {
      const jdData = await jdRes.json();
      setJobDescription(jdData.content);
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount, no data layer in this app
    load();
  }, [load]);

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-sm text-danger">Inzerát &bdquo;{slug}&ldquo; nebyl nalezen.</p>
        <Link href="/jobs" className="text-sm text-accent underline">
          Zpět na seznam inzerátů
        </Link>
      </div>
    );
  }

  if (!job) {
    return <p className="text-sm text-text-subtle">Načítám…</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/jobs" className="rounded-md p-1.5 text-text-muted transition hover:bg-surface hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">{job.slug}</h1>
        </div>
        <Link
          href={`/job-descriptions?file=${encodeURIComponent(job.jobDescriptionFile)}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted underline transition hover:text-accent"
        >
          Upravit popis pozice <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <details className="rounded-xl border border-border-subtle bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-medium text-text-primary">Náhled popisu pozice</summary>
        <div className="prose prose-sm mt-3 max-w-none leading-relaxed text-text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{jobDescription}</ReactMarkdown>
        </div>
      </details>

      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-card p-4 shadow-sm">
        <span className="text-sm font-medium text-text-primary">Generování</span>
        <div className="flex flex-wrap gap-3">
          <ScriptRunner label="Generovat CV" endpoint="/api/generate/cv" body={{ slug }} onDone={load} />
          <ScriptRunner
            label="Generovat průvodní dopis"
            endpoint="/api/generate/cover-letter"
            body={{ slug }}
            disabled={!job.outputs.cvMd.exists}
            onDone={load}
          />
          <ScriptRunner
            label="Přeložit CV do AJ"
            endpoint="/api/generate/translate"
            body={{ slug, doc: "cv" }}
            disabled={!job.outputs.cvMd.exists}
            variant="secondary"
            onDone={load}
          />
          <ScriptRunner
            label="Přeložit dopis do AJ"
            endpoint="/api/generate/translate"
            body={{ slug, doc: "letter" }}
            disabled={!job.outputs.letterMd.exists}
            variant="secondary"
            onDone={load}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OutputDocPanel
          slug={slug}
          title="CV (CZ)"
          md={job.outputs.cvMd}
          pdf={job.outputs.cvPdf}
          doc="cv"
          lang="cs"
          onChanged={load}
        />
        <OutputDocPanel
          slug={slug}
          title="CV (EN)"
          md={job.outputs.cvMdEn}
          pdf={job.outputs.cvPdfEn}
          doc="cv"
          lang="en"
          onChanged={load}
        />
        <OutputDocPanel
          slug={slug}
          title="Průvodní dopis (CZ)"
          md={job.outputs.letterMd}
          pdf={job.outputs.letterPdf}
          doc="letter"
          lang="cs"
          onChanged={load}
        />
        <OutputDocPanel
          slug={slug}
          title="Průvodní dopis (EN)"
          md={job.outputs.letterMdEn}
          pdf={job.outputs.letterPdfEn}
          doc="letter"
          lang="en"
          onChanged={load}
        />
      </div>
    </div>
  );
}
