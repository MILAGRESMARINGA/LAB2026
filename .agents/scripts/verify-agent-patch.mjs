import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { applyAgentPatch, validateAgentPatch } from "./agent-writer-core.mjs";

const root = process.cwd();
function run(command) {
  const commands = {
    "npm run verify:engineering": ["npm", ["run", "verify:engineering"]],
    "npm test": ["npm", ["test"]],
    "npm run build": ["npm", ["run", "build"]],
  };
  const [bin, args] = commands[command] ?? [];
  if (!bin) throw Error("The artifact requested a test command outside the fixed allowlist.");
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: path.join(root, "lab-app"), env: process.env, stdio: "inherit", shell: false, timeout: 20 * 60 * 1000 });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve() : reject(Error(command + " failed with exit code " + code)));
  });
}
function gitHead() {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["rev-parse", "HEAD"], { cwd: root, env: process.env, stdio: ["ignore", "pipe", "ignore"], shell: false });
    let out = "";
    child.stdout.on("data", chunk => out += chunk);
    child.on("close", code => code === 0 ? resolve(out.trim()) : reject(Error("Could not identify verification base commit.")));
  });
}
async function main() {
  const file = process.env.AGENT_PATCH_FILE;
  if (!file || !fs.existsSync(file)) throw Error("Patch artifact is missing.");
  const patch = JSON.parse(fs.readFileSync(file, "utf8"));
  const head = await gitHead();
  if (patch.schema_version !== 1 || patch.base_sha !== head || patch.base_sha !== process.env.GITHUB_SHA) throw Error("Patch base SHA does not match the checked out trusted source.");
  if (typeof patch.agent !== "string" || typeof patch.summary !== "string" || !Array.isArray(patch.test_commands)) throw Error("Malformed patch metadata.");
  const valid = validateAgentPatch(patch.files);
  if (!valid.ok) throw Error("Patch rejected: " + valid.reason);
  const allowed = new Set(["npm run verify:engineering", "npm test", "npm run build"]);
  if (patch.test_commands.some(command => !allowed.has(command))) throw Error("Patch requested a command outside the fixed allowlist.");
  applyAgentPatch(root, valid.files);
  const commands = [...new Set(["npm run verify:engineering", "npm test", "npm run build", ...patch.test_commands])];
  for (const command of commands) await run(command);
  const report = { schema_version: 1, base_sha: patch.base_sha, agent: patch.agent, summary: patch.summary, files: valid.files, task: patch.task, estimated_incremental_cost_brl: patch.estimated_incremental_cost_brl, checks: commands, verified_at: new Date().toISOString() };
  const reportPath = path.join(path.dirname(file), "verified-patch.json");
  fs.writeFileSync(reportPath, JSON.stringify(report), { mode: 0o600 });
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## LABGame patch verification — PASSED\n\nAgent: `" + patch.agent + "`.\n\nChecks: " + commands.map(command => "`" + command + "`").join(", ") + ".\n\nThe test runner received no model key, GitHub token, or production credentials.\n");
  console.log("PATCH_VERIFIED " + JSON.stringify({ agent: patch.agent, files: valid.files.length, checks: commands }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error("LABGame patch verification failed: " + error.message); process.exitCode = 1; });
