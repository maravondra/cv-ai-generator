import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { generatedOutputsDir } from "@/lib/paths";
import { readTextFile, writeTextFile, deleteFile, isSafeName, UnsafePathError } from "@/lib/safe-fs";

type Ctx = { params: Promise<{ slug: string; name: string }> };

function isNodeNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "ENOENT";
}

function errorResponse(err: unknown) {
  if (err instanceof UnsafePathError) return NextResponse.json({ error: err.message }, { status: 400 });
  if (isNodeNotFound(err)) return NextResponse.json({ error: "Soubor nenalezen" }, { status: 404 });
  console.error(err);
  return NextResponse.json({ error: "Neočekávaná chyba serveru" }, { status: 500 });
}

function resolveJobDir(slug: string): string {
  if (!isSafeName(slug)) throw new UnsafePathError(slug);
  return path.join(generatedOutputsDir, slug);
}

function requireMarkdown(name: string) {
  if (!name.endsWith(".md")) {
    throw new UnsafePathError(name);
  }
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { slug, name } = await ctx.params;
    const decoded = decodeURIComponent(name);
    requireMarkdown(decoded);
    const content = await readTextFile(resolveJobDir(slug), decoded);
    return NextResponse.json({ name: decoded, content });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { slug, name } = await ctx.params;
    const decoded = decodeURIComponent(name);
    requireMarkdown(decoded);
    const body = await req.json();
    const content = typeof body?.content === "string" ? body.content : "";
    await writeTextFile(resolveJobDir(slug), decoded, content);
    return NextResponse.json({ name: decoded, content });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { slug, name } = await ctx.params;
    const decoded = decodeURIComponent(name);
    await deleteFile(resolveJobDir(slug), decoded);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
