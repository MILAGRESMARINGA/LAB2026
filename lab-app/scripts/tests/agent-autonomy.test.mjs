import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyAgentPatch, taskBranchName, validateAgentPatch } from "../../../.agents/scripts/agent-writer-core.mjs";

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
