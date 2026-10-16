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
  "The optional AI agent workflow is manual and is not invoked by this CI. This CI run sends no model requests. Secret availability is not inspected or changed by this report; the manual workflow skips when OPENAI_API_KEY is unavailable.",
  "",
  "AI calls are owner-authorized but can incur charges. The manifest and database enforce request, token and cache-miss caps; no zero-cost claim is made. AI output is advisory and cannot pass a production gate.",
  "",
  "Production closure remains subject to the automated backup and isolated restore gate documented in .agents/P0-CLOSURE-STATUS-2026-10-16.md."
);
const report = lines.join("\n") + "\n";
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
console.log(report);
if (jobs.some(([, result]) => result !== "success")) process.exitCode = 1;
