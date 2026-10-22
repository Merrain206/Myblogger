import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { relative, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const CONTAINER = "hermes-agent";
const CONTAINER_DIR = "/opt/data/memory";
const SAFE_MEDIA_NAME = /^[A-Za-z0-9_-]{1,120}\.(?:svg|png|jpg|jpeg|gif|webp)$/i;

export function isSafeMediaName(name: string): boolean {
  return SAFE_MEDIA_NAME.test(name)
    && !name.startsWith("-")
    && !/[\x00-\x1f\x7f/\\]/.test(name);
}

export function resolveMediaPath(directory: string, name: string): string | null {
  if (!isSafeMediaName(name)) return null;
  const target = resolve(directory, name);
  const relation = relative(resolve(directory), target);
  return relation && !relation.startsWith("..") && !relation.includes(":") ? target : null;
}

export function hermesMediaDirectory(): string {
  const configured = process.env.HERMES_MEDIA_PATH?.trim() || ".data/hermes";
  return resolve(process.cwd(), configured);
}

export async function syncHermesMedia(): Promise<string[]> {
  const destination = hermesMediaDirectory();
  await fs.mkdir(destination, { recursive: true });

  const { stdout } = await execFileAsync(
    "docker",
    ["exec", CONTAINER, "find", CONTAINER_DIR, "-maxdepth", "1", "-type", "f", "-printf", "%f\\n"],
    { shell: false, timeout: 15_000, maxBuffer: 256 * 1024, windowsHide: true },
  );

  const synced: string[] = [];
  for (const name of stdout.split("\n").filter(Boolean)) {
    const target = resolveMediaPath(destination, name);
    if (!target) continue;
    await execFileAsync(
      "docker",
      ["cp", "--", `${CONTAINER}:${CONTAINER_DIR}/${name}`, target],
      { shell: false, timeout: 30_000, maxBuffer: 256 * 1024, windowsHide: true },
    );
    synced.push(name);
  }
  return synced;
}
