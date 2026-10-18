import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyAgentPatch, taskBranchName, validateAgentPatch } from "../../../.agents/scripts/agent-writer-core.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

test("agent patch accepts only scoped source paths and applies in isolated workspace", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lab-agent-test-"));
  try {
    const files = [{ path: "lab-app/src/features/demo.ts", content: "export const safe = true;\n" }];
    assert.equal(validateAgentPatch(files).ok, true);
    assert.equal(applyAgentPatch(root, files), 1);
    assert.equal(fs.readFileSync(path.join(root, files[0].path), "utf8"), files[0].content);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("agent patch rejects policy, workflow, package, traversal, and secret paths/content", () => {
  for (const file of [
    { path: ".github/workflows/ai-agent-orchestrator.yml", content: "workflow" },
    { path: ".agents/manifest.json", content: "{}" },
    { path: "lab-app/package.json", content: "{}" },
    { path: "lab-app/src/../../.env", content: "safe" },
    { path: "lab-app/src/x.ts", content: "const key = 'sk-abcdefghijklmnop123';" },
  ]) assert.equal(validateAgentPatch([file]).ok, false);
});

test("agent branch ids are normalized and never target protected branches", () => {
  assert.equal(taskBranchName("feature 42 / P1"), "agent/feature-42-p1");
  assert.match(taskBranchName("../../main"), /^agent\//);
});

test("agent workflow separates generation, verification, and publication credentials", () => {
  const workflow = fs.readFileSync(path.join(repoRoot, ".github/workflows/ai-agent-orchestrator.yml"), "utf8");
  const generator = fs.readFileSync(path.join(repoRoot, ".agents/scripts/run-ai-orchestrator.mjs"), "utf8");
  const verifier = fs.readFileSync(path.join(repoRoot, ".agents/scripts/verify-agent-patch.mjs"), "utf8");
  const publisher = fs.readFileSync(path.join(repoRoot, ".agents/scripts/publish-agent-pr.mjs"), "utf8");
  assert.match(workflow, /OPENAI_API_KEY:/);
  assert.match(workflow, /contents: read[\s\S]*?issues: read/);
  assert.match(workflow, /contents: write[\s\S]*?pull-requests: write/);
  assert.match(workflow, /verify:[\s\S]*?npm ci[\s\S]*?verify-agent-patch\.mjs/);
  assert.match(workflow, /publish:[\s\S]*?needs: \[generate, verify\]/);
  assert.doesNotMatch(generator, /child_process|spawn\(|applyAgentPatch|createDraftPr|git ref|pulls.*POST/i);
  assert.doesNotMatch(verifier + workflow.slice(workflow.indexOf("  verify:"), workflow.indexOf("  publish:")), /OPENAI_API_KEY|GITHUB_TOKEN|secrets\./);
  assert.doesNotMatch(publisher, /OPENAI_API_KEY|child_process|spawn\(/);
});

test("zero approved spend skips inference and produces no patch artifact", () => {
  const root = repoRoot;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "lab-agent-zero-budget-"));
  try {
    const output = path.join(temp, "github-output.txt");
    const runnerTemp = path.join(temp, "runner");
    const result = spawnSync(process.execPath, [".agents/scripts/run-ai-orchestrator.mjs"], {
      cwd: root,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        GITHUB_REF: "refs/heads/lab-rebuild-2026",
        GITHUB_REPOSITORY: "MILAGRESMARINGA/LAB2026",
        GITHUB_SHA: "a".repeat(40),
        APPROVED_SPEND_BRL: "0",
        RUNNER_TEMP: runnerTemp,
        GITHUB_OUTPUT: output,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /R\$ 0,00/);
    assert.match(fs.readFileSync(output, "utf8"), /patch_ready=false/);
    assert.equal(fs.existsSync(path.join(runnerTemp, "lab-agent-patch", "patch.json")), false);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
