import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, ".agents/manifest.json"), "utf8"));
const expected = [
  "principal-architect",
  "ai-engineer",
  "backend-engineer",
  "database-engineer",
  "integration-engineer",
  "security-engineer",
  "qa-reliability-engineer",
  "frontend-ux-engineer",
  "ux-designer",
  "gamification-engineer",
  "biblical-canon-engineer",
  "platform-observability-engineer"
];
assert.equal(manifest.schema_version, 2, "manifest schema_version must be 2");
assert.equal(manifest.orchestration.lead, "ai-engineer", "ai-engineer must be the orchestrator");
assert.equal(manifest.orchestration.llm_inference_enabled_by_default, true, "inference capability must be enabled behind the per-run budget gate");
assert.equal(manifest.orchestration.production_mutations_from_ai_workflow, "president_approval_required");
assert.equal(manifest.orchestration.llm_can_execute_commands, true, "command capability is enabled only through runner allowlist");
assert.equal(manifest.orchestration.llm_can_write_repository, true, "writes are limited to isolated agent branches and draft PRs");
assert.equal(manifest.cost_policy.incremental_cost_limit_brl, 0, "paid inference is disabled absent an explicit run budget");
assert.deepEqual(manifest.orchestration.repository_write_scope, ["agent/*", "auto/*"]);
assert.deepEqual(manifest.orchestration.protected_branches, ["main", "lab-rebuild-2026"]);
assert.deepEqual(manifest.orchestration.workflow_call_order, [
  "principal-architect",
  "backend-engineer",
  "database-engineer",
  "integration-engineer",
  "security-engineer",
  "qa-reliability-engineer",
  "frontend-ux-engineer",
  "ux-designer",
  "gamification-engineer",
  "biblical-canon-engineer",
  "platform-observability-engineer",
  "ai-engineer"
], "AI runtime must run eleven specialists sequentially and synthesize last with ai-engineer");
assert.equal(manifest.cost_policy.api_usage, "president-approved-per-run-budget-required");
assert.equal(manifest.cost_policy.no_paid_plan_upgrade, true);
assert.deepEqual(manifest.cost_policy.study_generation, {
  provider_model: "gpt-6-luna",
  max_cache_misses_global_per_utc_day: 10,
  max_cache_misses_per_user_per_utc_day: 3,
  max_output_tokens: 1200,
  max_prompt_bytes: 64000,
  provider_timeout_seconds: 25,
  fail_closed_without_openai_api_key: true
});
assert.deepEqual(Object.fromEntries(Object.entries(manifest.cost_policy.ai_orchestrator).filter(([key]) => !["provider_model", "max_approved_spend_brl_per_run", "max_files_per_patch", "max_patch_bytes", "maximum_test_commands"].includes(key))), {
  max_runs_per_rolling_24h: 1,
  max_calls_per_run: 12,
  max_calls_per_agent: 1,
  max_output_tokens_per_call: 6000,
  max_output_tokens_per_run: 6000,
  max_request_bytes_per_run: 98304,
  retries: 0
});
assert.equal(manifest.cost_policy.ai_orchestrator.provider_model, "gpt-6-luna");
assert.equal(manifest.cost_policy.ai_orchestrator.max_approved_spend_brl_per_run, 100);
assert.deepEqual(manifest.cost_policy.ai_orchestrator.maximum_test_commands, ["npm run verify:engineering", "npm test", "npm run build"]);
assert.deepEqual(manifest.agents.map((agent) => agent.id), expected, "manifest must contain the official twelve agents in order");

const agentRoot = path.join(root, ".agents/agents");
const actual = fs.readdirSync(agentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => fs.existsSync(path.join(agentRoot, entry.name, "agent.md")))
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(actual, [...expected].sort(), "only the twelve manifest agents may have active agent.md contracts");

for (const agent of manifest.agents) {
  const content = fs.readFileSync(path.join(root, ".agents", agent.path), "utf8");
  assert.ok(content.startsWith("---\nname: " + agent.id + "\n"), agent.id + " frontmatter mismatch");
  for (const phrase of [
    "PROMPT DE SISTEMA",
    "Custo de IA: chamadas foram autorizadas pelo responsável dentro dos limites do manifesto e podem gerar cobrança",
    "backup atual",
    "CRMIMOBI",
    "Não exponha segredos"
  ]) {
    assert.ok(content.includes(phrase), agent.id + " is missing guardrail: " + phrase);
  }
  assert.ok(!content.includes("Custo incremental: R$ 0"), agent.id + " still claims zero incremental cost");
}
console.log("Agent contract OK: exactly twelve agents, bounded potentially billable API use and production guardrails verified.");
