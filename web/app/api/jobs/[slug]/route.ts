import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { jobDescriptionsDir } from "@/lib/paths";
import { fileExists, isSafeName } from "@/lib/safe-fs";
import { getJob } from "@/lib/jobs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!isSafeName(slug)) {
    return NextResponse.json({ error: "Neplatný identifikátor inzerátu" }, { status: 400 });
  }
  if (!(await fileExists(path.join(jobDescriptionsDir, `${slug}.md`)))) {
    return NextResponse.json({ error: "Inzerát nebyl nalezen" }, { status: 404 });
  }
  const job = await getJob(slug);
  return NextResponse.json({ job });
}
