import fs from "node:fs";

const jobs = [
  ["engineering/build/unit", process.env.LAB_VERIFY],
  ["PostgreSQL 16/17", process.env.LAB_POSTGRES],
  ["Auth/RLS/E2E local", process.env.LAB_AUTH],
  ["eight-agent contract", process.env.LAB_AGENTS]
];
const lines = [
  "# LABGAME P0 — CI orchestrator report",
  "",
  "Commit: " + (process.env.GITHUB_SHA || "unknown"),
  "",
  "| Gate | Result |",
  "|---|---|"
];
for (const [name, result] of jobs) lines.push("| " + name + " | " + (result || "unknown") + " |");
lines.push(
  "",
  "This workflow runs repository tests and contract checks only. It does not run production migrations, deploy Edge Functions, send production email, or modify data.",
  "",
  "Production closure remains subject to the current backup and isolated restore drill documented in .agents/P0-CLOSURE-STATUS-2026-10-16.md."
);
const report = lines.join("\n") + "\n";
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
console.log(report);
if (jobs.some(([, result]) => result !== "success")) process.exitCode = 1;
