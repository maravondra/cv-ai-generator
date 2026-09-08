import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { generatedOutputsDir, scripts } from "@/lib/paths";
import { isSafeName, fileExists } from "@/lib/safe-fs";
import { runPythonScript } from "@/lib/run-script";
import { jobDescriptionsDir } from "@/lib/paths";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug : "";

  if (!isSafeName(slug)) {
    return NextResponse.json({ error: "Neplatný identifikátor inzerátu" }, { status: 400 });
  }
  if (!(await fileExists(path.join(jobDescriptionsDir, `${slug}.md`)))) {
    return NextResponse.json({ error: "Inzerát nebyl nalezen" }, { status: 404 });
  }

  const outputDir = path.join(generatedOutputsDir, slug);
  const stream = runPythonScript(scripts.generateCv, [slug, "--output-dir", outputDir]);

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
