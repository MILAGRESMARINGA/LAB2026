import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const manifestPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const ALLOWED = [
  /^lab-app\/src\/[A-Za-z0-9_./-]+\.(?:ts|tsx|css)$/,
  /^lab-app\/tests\/[A-Za-z0-9_./-]+\.(?:ts|tsx)$/,
  /^lab-app\/scripts\/tests\/[A-Za-z0-9_./-]+\.mjs$/,
  /^lab-app\/supabase\/functions\/[A-Za-z0-9_./-]+\.(?:ts|js|mjs)$/,
  /^lab-app\/supabase\/migrations\/[0-9]{12}_[A-Za-z0-9_-]+\.sql$/,
];
const SENSITIVE = /(?:sk-[A-Za-z0-9]{16,}|eyJ[A-Za-z0-9._-]{20,}|postgres(?:ql)?:\/\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY\s*=|OPENAI_API_KEY\s*=)/iu;
const MAX_FILES = 8;
const MAX_TOTAL_BYTES = 400_000;

function globRegex(glob) {
  let source = "^";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*" && glob[i + 1] === "*") {
      i++;
      if (glob[i + 1] === "/") { i++; source += "(?:.*/)?"; }
      else source += ".*";
    } else if (char === "*") source += "[^/]*";
    else source += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  }
  return new RegExp(source + "$");
}
function roleCanWrite(agentId, name) {
  if (agentId === undefined) return true; // legacy unit helper; runtime paths always pass the assigned agent.
  const agent = manifest.agents.find(item => item.id === agentId);
  return Boolean(agent?.write_paths?.some(glob => globRegex(glob).test(name)));
}

export function taskBranchName(value) {
  const normalized = String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 42) || "task";
  return "agent/" + normalized;
}

export function validateAgentPatch(input, agentId) {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_FILES) return { ok: false, reason: "Patch must contain 1–8 files." };
  const seen = new Set();
  let bytes = 0;
  const files = [];
  for (const item of input) {
    if (!item || typeof item.path !== "string" || typeof item.content !== "string") return { ok: false, reason: "Malformed file entry." };
    const name = item.path.replaceAll("\\", "/");
    if (name.startsWith("/") || name.includes("\0") || name.split("/").some(part => part === ".." || part === ".") || !ALLOWED.some(pattern => pattern.test(name))) return { ok: false, reason: "Path is outside the controlled LABGame write allowlist." };
    if (!roleCanWrite(agentId, name)) return { ok: false, reason: "Path is outside the assigned specialist's write scope." };
    if (seen.has(name)) return { ok: false, reason: "Duplicate target path." };
    seen.add(name);
    if (SENSITIVE.test(item.content) || item.content.includes("\0")) return { ok: false, reason: "Sensitive material or binary content detected." };
    const size = Buffer.byteLength(item.content, "utf8");
    if (size > 100_000) return { ok: false, reason: "File exceeds size ceiling." };
    bytes += size;
    files.push({ path: name, content: item.content });
  }
  if (bytes > MAX_TOTAL_BYTES) return { ok: false, reason: "Patch exceeds total byte ceiling." };
  return { ok: true, files };
}

export function applyAgentPatch(root, files, agentId) {
  const validated = validateAgentPatch(files, agentId);
  if (!validated.ok) throw Error(validated.reason);
  const base = fs.realpathSync(root);
  for (const file of validated.files) {
    const target = path.resolve(base, file.path);
    if (!target.startsWith(base + path.sep)) throw Error("Path escaped repository root.");
    let cursor = base;
    for (const segment of file.path.split("/").slice(0, -1)) {
      cursor = path.join(cursor, segment);
      if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw Error("Symlink parent is not writable.");
    }
    if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw Error("Symlink target is not writable.");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content, { encoding: "utf8", flag: "w" });
  }
  return validated.files.length;
}
