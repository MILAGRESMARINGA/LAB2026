import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, ".agents/manifest.json"), "utf8"));
const expected = [
  "ai-engineer",
  "backend-engineer",
  "database-engineer",
  "security-engineer",
  "frontend-ux-engineer",
  "qa-reliability-engineer",
  "integration-engineer",
  "platform-observability-engineer"
];
assert.equal(manifest.schema_version, 1, "manifest schema_version must be 1");
assert.equal(manifest.orchestration.lead, "ai-engineer", "ai-engineer must be the orchestrator");
assert.equal(manifest.incremental_cost_limit_brl, 0, "incremental cost limit must be R$ 0");
assert.deepEqual(manifest.agents.map((agent) => agent.id), expected, "manifest must contain the official eight agents in order");

const agentRoot = path.join(root, ".agents/agents");
const actual = fs.readdirSync(agentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => fs.existsSync(path.join(agentRoot, entry.name, "agent.md")))
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(actual, [...expected].sort(), "only the eight manifest agents may have active agent.md contracts");

for (const agent of manifest.agents) {
  const content = fs.readFileSync(path.join(root, ".agents", agent.path), "utf8");
  assert.ok(content.startsWith("---\nname: " + agent.id + "\n"), agent.id + " frontmatter mismatch");
  for (const phrase of ["PROMPT DE SISTEMA", "Custo incremental: R$ 0", "backup atual", "CRMIMOBI", "Não exponha segredos"]) {
    assert.ok(content.includes(phrase), agent.id + " is missing guardrail: " + phrase);
  }
}
console.log("Agent contract OK: exactly eight agents and shared guardrails verified.");
