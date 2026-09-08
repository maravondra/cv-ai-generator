import fs from "node:fs/promises";
import path from "node:path";
import { jobDescriptionsDir, generatedOutputsDir } from "./paths";
import { fileExists } from "./safe-fs";

export interface OutputVariant {
  /** e.g. "CV_Marek_Vondra_<slug>.md" */
  name: string;
  exists: boolean;
}

export interface JobOutputs {
  cvMd: OutputVariant;
  cvPdf: OutputVariant;
  cvMdEn: OutputVariant;
  cvPdfEn: OutputVariant;
  letterMd: OutputVariant;
  letterPdf: OutputVariant;
  letterMdEn: OutputVariant;
  letterPdfEn: OutputVariant;
}

export interface Job {
  slug: string;
  jobDescriptionFile: string;
  outputDir: string;
  outputs: JobOutputs;
}

async function variant(dir: string, name: string): Promise<OutputVariant> {
  return { name, exists: await fileExists(path.join(dir, name)) };
}

export async function getJob(slug: string): Promise<Job> {
  const outputDir = path.join(generatedOutputsDir, slug);
  const base = `Marek_Vondra_${slug}`;
  const [cvMd, cvPdf, cvMdEn, cvPdfEn, letterMd, letterPdf, letterMdEn, letterPdfEn] =
    await Promise.all([
      variant(outputDir, `CV_${base}.md`),
      variant(outputDir, `CV_${base}.pdf`),
      variant(outputDir, `CV_${base}_EN.md`),
      variant(outputDir, `CV_${base}_EN.pdf`),
      variant(outputDir, `CoverLetter_${base}.md`),
      variant(outputDir, `CoverLetter_${base}.pdf`),
      variant(outputDir, `CoverLetter_${base}_EN.md`),
      variant(outputDir, `CoverLetter_${base}_EN.pdf`),
    ]);

  return {
    slug,
    jobDescriptionFile: `${slug}.md`,
    outputDir,
    outputs: { cvMd, cvPdf, cvMdEn, cvPdfEn, letterMd, letterPdf, letterMdEn, letterPdfEn },
  };
}

export async function listJobs(): Promise<Job[]> {
  await fs.mkdir(jobDescriptionsDir, { recursive: true });
  const entries = await fs.readdir(jobDescriptionsDir, { withFileTypes: true });
  const slugs = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name.slice(0, -3))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(slugs.map(getJob));
}
