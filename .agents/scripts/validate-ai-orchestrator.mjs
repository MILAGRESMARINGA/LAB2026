import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/ai-agent-orchestrator.yml", "utf8");
const runner = fs.readFileSync(".agents/scripts/run-ai-orchestrator.mjs", "utf8");
const manifest = JSON.parse(fs.readFileSync(".agents/manifest.json", "utf8"));
const caps = manifest.cost_policy.ai_orchestrator;

assert.match(workflow, /^on:\n  workflow_dispatch:\s*$/m, "AI workflow must be manual only");
assert.doesNotMatch(workflow, /^\s+(push|pull_request|schedule):/m, "AI workflow must not run on push, PR or schedule");
assert.match(workflow, /contents:\s*read/);
assert.match(workflow, /actions:\s*read/);
assert.doesNotMatch(workflow, /contents:\s*write|actions:\s*write|pull-requests:\s*write/);
assert.match(workflow, /github\.ref == 'refs\/heads\/lab-rebuild-2026'/);
assert.match(workflow, /OPENAI_API_KEY:\s*\$\{\{\s*secrets\.OPENAI_API_KEY\s*\}\}/);
assert.match(workflow, /GITHUB_TOKEN:\s*\$\{\{\s*github\.token\s*\}\}/);
for (const forbidden of ["SUPABASE_ACCESS_TOKEN", "SUPABASE_DB_PASSWORD", "SUPABASE_SECRET_KEY", "VERCEL_TOKEN", "DATABASE_URL"]) {
  assert.ok(!workflow.includes(forbidden), "workflow must not expose " + forbidden);
}
assert.doesNotMatch(workflow, /supabase\s+(db\s+push|functions\s+deploy)/i);
assert.match(runner, /if \(!process\.env\.OPENAI_API_KEY\)/, "missing key must fail closed before provider calls");
assert.match(runner, /await enforceDailyRunLimit\(\)/);
assert.match(runner, /for \(const agent of agents\)/, "model calls must be sequential");
assert.match(runner, /JSON\.stringify\(workflowCallOrder\)/);
assert.match(runner, /Seven specialist notes \(JSON data\)/, "lead synthesis must receive specialist handoffs as data");
assert.match(runner, /maximumOrchestratorRequest/, "worst-case synthesis input must be counted before the first call");
assert.deepEqual(manifest.orchestration.workflow_call_order, [
  "backend-engineer",
  "database-engineer",
  "security-engineer",
  "frontend-ux-engineer",
  "qa-reliability-engineer",
  "integration-engineer",
  "platform-observability-engineer",
  "ai-engineer"
]);
assert.match(runner, /https:\/\/api\.openai\.com\/v1\/responses/);
assert.match(runner, /max_output_tokens: caps\.max_output_tokens_per_call/);
assert.match(runner, /store: false/);
assert.match(runner, /No retry was made/);
assert.match(runner, /P0-CLOSURE-STATUS-2026-10-16\.md/);
assert.match(runner, /GITHUB_STEP_SUMMARY/);
assert.doesNotMatch(runner, /child_process|execSync|spawnSync|Deno\.Command|Bun\.spawn/);
assert.doesNotMatch(runner, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|VERCEL_TOKEN/);
assert.equal(caps.max_runs_per_rolling_24h, 1);
assert.equal(caps.max_calls_per_run, 8);
assert.equal(caps.max_calls_per_agent, 1);
assert.equal(caps.max_output_tokens_per_call, 128);
assert.equal(caps.max_output_tokens_per_run, 1024);
assert.equal(caps.max_request_bytes_per_run, 65536);
assert.equal(caps.retries, 0);
assert.ok(runner.includes('fs.appendFileSync(target, markdown + "\n")'), "summary output must contain real newline escapes");
assert.ok(runner.includes('fs.appendFileSync(target, markdown + "\\n")'), "summary output must contain real newline escapes");
assert.ok(runner.includes('const rows = section.split("\\n")'), "P0 report parsing must split actual lines");
assert.ok(runner.includes('const nextHeading = tail.slice(1).search(/\\n## /)'), "P0 heading parsing must recognize actual lines");
