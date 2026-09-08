import { spawn } from "node:child_process";
import { pythonBin, projectRoot } from "./paths";

/** Sentinel line appended to the stream once the process exits, carrying its exit code. */
export const DONE_PREFIX = "__SCRIPT_DONE__:";

/**
 * Runs a Python script as a child process (argv array, no shell) with cwd set to the
 * Python project root, and returns a ReadableStream of its combined stdout/stderr as
 * they arrive, followed by a `__SCRIPT_DONE__:<exitCode>` sentinel line.
 */
export function runPythonScript(scriptPath: string, args: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const safeEnqueue = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };

      const child = spawn(pythonBin, [scriptPath, ...args], {
        cwd: projectRoot,
        env: process.env,
      });

      child.stdout.on("data", (data: Buffer) => safeEnqueue(data.toString("utf-8")));
      child.stderr.on("data", (data: Buffer) => safeEnqueue(data.toString("utf-8")));

      child.on("error", (err) => {
        safeEnqueue(`\n❌ Nepodařilo se spustit skript: ${err.message}\n`);
        safeEnqueue(`${DONE_PREFIX}1\n`);
        closed = true;
        controller.close();
      });

      child.on("close", (code) => {
        if (closed) return;
        safeEnqueue(`${DONE_PREFIX}${code ?? 1}\n`);
        closed = true;
        controller.close();
      });
    },
  });
}
