import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { generatedOutputsDir, jobDescriptionsDir, scripts } from "@/lib/paths";
import { isSafeName, fileExists } from "@/lib/safe-fs";
import { runPythonScript } from "@/lib/run-script";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug : "";

  if (!isSafeName(slug)) {
    return NextResponse.json({ error: "Neplatný identifikátor inzerátu" }, { status: 400 });
  }

  const outputDir = path.join(generatedOutputsDir, slug);
  const cvPath = path.join(outputDir, `CV_Marek_Vondra_${slug}.md`);
  const jobPath = path.join(jobDescriptionsDir, `${slug}.md`);
  const outputPath = path.join(outputDir, `CoverLetter_Marek_Vondra_${slug}.md`);

  if (!(await fileExists(cvPath))) {
    return NextResponse.json(
      { error: "Nejprve je potřeba vygenerovat CV pro tento inzerát" },
      { status: 400 }
    );
  }

  const args = [cvPath, "--output", outputPath];
  if (await fileExists(jobPath)) {
    args.push("--job", jobPath);
  }

  const stream = runPythonScript(scripts.generateCoverLetter, args);
  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
