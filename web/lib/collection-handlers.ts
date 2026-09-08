import { NextRequest, NextResponse } from "next/server";
import {
  listMarkdownFiles,
  readTextFile,
  writeTextFile,
  deleteFile,
  renameFile,
  isSafeName,
  fileExists,
  safeJoin,
  UnsafePathError,
} from "./safe-fs";

function isNodeNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "ENOENT";
}

function errorResponse(err: unknown) {
  if (err instanceof UnsafePathError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (isNodeNotFound(err)) {
    return NextResponse.json({ error: "Soubor nenalezen" }, { status: 404 });
  }
  console.error(err);
  return NextResponse.json({ error: "Neočekávaná chyba serveru" }, { status: 500 });
}

/** Handlers for the collection root: GET (list) and POST (create new .md file). */
export function makeCollectionRoutes(baseDir: string) {
  async function GET() {
    try {
      const files = await listMarkdownFiles(baseDir);
      return NextResponse.json({ files });
    } catch (err) {
      return errorResponse(err);
    }
  }

  async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const content = typeof body?.content === "string" ? body.content : "";

      if (!isSafeName(name) || !name.endsWith(".md")) {
        return NextResponse.json(
          { error: "Neplatný název souboru – musí to být jednoduchý název končící na .md" },
          { status: 400 }
        );
      }
      const filePath = safeJoin(baseDir, name);
      if (await fileExists(filePath)) {
        return NextResponse.json({ error: "Soubor s tímto názvem už existuje" }, { status: 409 });
      }
      await writeTextFile(baseDir, name, content);
      return NextResponse.json({ name, content }, { status: 201 });
    } catch (err) {
      return errorResponse(err);
    }
  }

  return { GET, POST };
}

type ItemContext = { params: Promise<{ name: string }> };

/** Handlers for a single item: GET (read), PUT (save), PATCH (rename), DELETE. */
export function makeItemRoutes(baseDir: string) {
  async function GET(_req: NextRequest, ctx: ItemContext) {
    try {
      const { name } = await ctx.params;
      const decoded = decodeURIComponent(name);
      const content = await readTextFile(baseDir, decoded);
      return NextResponse.json({ name: decoded, content });
    } catch (err) {
      return errorResponse(err);
    }
  }

  async function PUT(req: NextRequest, ctx: ItemContext) {
    try {
      const { name } = await ctx.params;
      const decoded = decodeURIComponent(name);
      const body = await req.json();
      const content = typeof body?.content === "string" ? body.content : "";
      await writeTextFile(baseDir, decoded, content);
      return NextResponse.json({ name: decoded, content });
    } catch (err) {
      return errorResponse(err);
    }
  }

  async function PATCH(req: NextRequest, ctx: ItemContext) {
    try {
      const { name } = await ctx.params;
      const decoded = decodeURIComponent(name);
      const body = await req.json();
      const newName = typeof body?.newName === "string" ? body.newName.trim() : "";
      if (!isSafeName(newName) || !newName.endsWith(".md")) {
        return NextResponse.json(
          { error: "Neplatný nový název souboru – musí končit na .md" },
          { status: 400 }
        );
      }
      const targetPath = safeJoin(baseDir, newName);
      if (await fileExists(targetPath)) {
        return NextResponse.json({ error: "Soubor s tímto názvem už existuje" }, { status: 409 });
      }
      await renameFile(baseDir, decoded, newName);
      return NextResponse.json({ name: newName });
    } catch (err) {
      return errorResponse(err);
    }
  }

  async function DELETE(_req: NextRequest, ctx: ItemContext) {
    try {
      const { name } = await ctx.params;
      await deleteFile(baseDir, decodeURIComponent(name));
      return NextResponse.json({ ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  }

  return { GET, PUT, PATCH, DELETE };
}
