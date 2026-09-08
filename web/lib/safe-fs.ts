import fs from "node:fs/promises";
import path from "node:path";

export class UnsafePathError extends Error {
  constructor(name: string) {
    super(`Invalid file name: "${name}"`);
    this.name = "UnsafePathError";
  }
}

/**
 * Resolves `name` inside `baseDir` and guarantees the result cannot escape it
 * (blocks "..", absolute paths, symlink-free traversal via segment checks).
 */
export function safeJoin(baseDir: string, name: string): string {
  if (!name || name.includes("\0")) throw new UnsafePathError(name);
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, name);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
    throw new UnsafePathError(name);
  }
  return resolved;
}

/** A safe file/folder name: no separators, no leading dot, no traversal. */
export function isSafeName(name: string): boolean {
  return /^[^/\\\0]+$/.test(name) && name !== "." && name !== "..";
}

export interface MarkdownFileInfo {
  name: string;
  size: number;
  mtime: string;
}

export async function listMarkdownFiles(dir: string): Promise<MarkdownFileInfo[]> {
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.endsWith(".md"));
  const infos = await Promise.all(
    files.map(async (e) => {
      const stat = await fs.stat(path.join(dir, e.name));
      return { name: e.name, size: stat.size, mtime: stat.mtime.toISOString() };
    })
  );
  return infos.sort((a, b) => a.name.localeCompare(b.name));
}

export async function readTextFile(baseDir: string, name: string): Promise<string> {
  const filePath = safeJoin(baseDir, name);
  return fs.readFile(filePath, "utf-8");
}

export async function writeTextFile(baseDir: string, name: string, content: string): Promise<void> {
  const filePath = safeJoin(baseDir, name);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

export async function deleteFile(baseDir: string, name: string): Promise<void> {
  const filePath = safeJoin(baseDir, name);
  await fs.rm(filePath, { force: true });
}

export async function renameFile(baseDir: string, oldName: string, newName: string): Promise<void> {
  const from = safeJoin(baseDir, oldName);
  const to = safeJoin(baseDir, newName);
  await fs.rename(from, to);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
