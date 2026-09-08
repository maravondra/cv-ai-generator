import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { generatedOutputsDir, scripts } from "@/lib/paths";
import { isSafeName, fileExists } from "@/lib/safe-fs";
import { runPythonScript } from "@/lib/run-script";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const doc = body?.doc === "letter" ? "letter" : body?.doc === "cv" ? "cv" : "";
  const lang = body?.lang === "en" ? "en" : "cs";

  if (!isSafeName(slug) || !doc) {
    return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 });
  }

  const outputDir = path.join(generatedOutputsDir, slug);
  const baseName =
    (doc === "cv" ? `CV_Marek_Vondra_${slug}` : `CoverLetter_Marek_Vondra_${slug}`) +
    (lang === "en" ? "_EN" : "");
  const mdPath = path.join(outputDir, `${baseName}.md`);
  const pdfPath = path.join(outputDir, `${baseName}.pdf`);
  const script = doc === "cv" ? scripts.renderCvPdf : scripts.renderLetterPdf;

  if (!(await fileExists(mdPath))) {
    return NextResponse.json({ error: "Markdown dokument nebyl nalezen" }, { status: 404 });
  }

  const stream = runPythonScript(script, [mdPath, "--output", pdfPath]);
  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
