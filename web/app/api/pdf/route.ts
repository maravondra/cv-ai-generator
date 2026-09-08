import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { generatedOutputsDir } from "@/lib/paths";
import { isSafeName, safeJoin, UnsafePathError } from "@/lib/safe-fs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "";
  const name = searchParams.get("name") || "";
  const download = searchParams.get("download") === "1";

  try {
    if (!isSafeName(slug) || !name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 });
    }
    const jobDir = path.join(generatedOutputsDir, slug);
    const filePath = safeJoin(jobDir, name);
    const data = await fs.readFile(filePath);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof UnsafePathError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "ENOENT") {
      return NextResponse.json({ error: "PDF nebylo nalezeno" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Neočekávaná chyba serveru" }, { status: 500 });
  }
}
