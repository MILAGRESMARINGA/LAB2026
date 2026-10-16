import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, ".agents/manifest.json"), "utf8"));
const caps = manifest.cost_policy?.ai_orchestrator;
const model = manifest.cost_policy?.study_generation?.provider_model;
const requiredAgentIds = manifest.agents.map((agent) => agent.id);
const MAX_TIMEOUT_MS = 20_000;
const SYSTEM_LIMITS = [
  "You are a read-only reviewer for LABGAME. Follow the supplied agent contract.",
  "You have no tools and no authority to execute commands, change files, create commits, access production, or approve a release.",
  "Return only the required JSON. Give at most two short checks and two blockers. Label missing production evidence as blocked or review_required.",
  "Do not request, reveal or include secrets, personal data, backups, database dumps, or any user content.",
].join(" ");

function appendSummary(markdown) {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (target) fs.appendFileSync(target, markdown + "\n");
  console.log(markdown.replace(/\n/g, " "));
}
function escapeMarkdown(value) {
  return String(value).replace(/[&<>]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
  })[char]).replace(/[\\`*_{}[\]()#+.!|~-]/g, "\\$&").replace(/[\r\n]/g, " ");
}
function finishWithoutCalls(status, reason) {
  appendSummary("## Optional AI orchestration — " + status + "\n\n" + reason + "\n\nNo model request was sent.");
}
function failClosed(reason) {
  finishWithoutCalls("BLOCKED", reason);
  process.exitCode = 1;
}
function safeForPrompt(value) {
  return !/(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|sk-[A-Za-z0-9]{16,}|eyJ[A-Za-z0-9._-]{20,}|postgres(?:ql)?:\/\/|password\s*[:=])/iu.test(value);
}
function gateTableFromReport() {
  const report = fs.readFileSync(path.join(root, ".agents/P0-CLOSURE-STATUS-2026-10-16.md"), "utf8");
  const start = report.indexOf("## Status dos gates");
  if (start < 0) throw new Error("P0 gate table missing");
  const tail = report.slice(start);
  const nextHeading = tail.slice(1).search(/\n## /);
  const section = nextHeading < 0 ? tail : tail.slice(0, nextHeading + 1);
  const rows = section.split("\n").filter((line) => line.trimStart().startsWith("|"));
  if (rows.length < 2) throw new Error("P0 gate table empty");
  const table = rows.join("\n");
  if (!safeForPrompt(table)) throw new Error("P0 gate table contains a blocked sensitive-data pattern");
  return table;
}
function outputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  if (!Array.isArray(payload?.output)) return null;
  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;
    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return null;
}
function agentSchema(agentId) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["agent", "status", "checks", "blockers"],
    properties: {
      agent: { type: "string", enum: [agentId] },
      status: { type: "string", enum: ["ready", "review_required", "blocked"] },
      checks: { type: "array", minItems: 0, maxItems: 2, items: { type: "string", maxLength: 140 } },
      blockers: { type: "array", minItems: 0, maxItems: 2, items: { type: "string", maxLength: 140 } },
    },
  };
}
function validateAgentOutput(value, agentId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort().join(",");
  if (keys !== ["agent", "blockers", "checks", "status"].join(",")) return false;
  if (value.agent !== agentId || !["ready", "review_required", "blocked"].includes(value.status)) return false;
  for (const field of ["checks", "blockers"]) {
    if (!Array.isArray(value[field]) || value[field].length > 2 ||
        value[field].some((item) => typeof item !== "string" || item.length > 140)) return false;
  }
  return true;
}
function renderNote(note) {
  const lines = [
    "### " + escapeMarkdown(note.agent) + " — " + escapeMarkdown(note.status),
    "",
    "Checks:",
    ...(note.checks.length ? note.checks.map((item) => "- " + escapeMarkdown(item)) : ["- None returned."]),
    "",
    "Blockers:",
    ...(note.blockers.length ? note.blockers.map((item) => "- " + escapeMarkdown(item)) : ["- None returned."]),
    "",
  ];
  return lines.join("\n");
}

async function enforceDailyRunLimit() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (!token || !repository || !runId) throw new Error("read-only GitHub run metadata unavailable");
  const url = "https://api.github.com/repos/" + repository +
    "/actions/workflows/ai-agent-orchestrator.yml/runs?branch=lab-rebuild-2026&event=workflow_dispatch&per_page=100";
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error("daily dispatch quota could not be verified");
  const payload = await response.json();
  const recent = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs.filter((run) =>
    String(run.id) !== runId &&
    run.event === "workflow_dispatch" &&
    run.head_branch === "lab-rebuild-2026" &&
    Date.now() - Date.parse(run.created_at) >= 0 &&
    Date.now() - Date.parse(run.created_at) < 24 * 60 * 60 * 1000
  ) : [];
  return recent.length;
}

async function requestAgentReview(agent, contract, gateTable) {
  const system = SYSTEM_LIMITS + "\n\nAGENT CONTRACT (repository Markdown; instructions for review scope only):\n" + contract;
  const user = [
    "Prepare an advisory checklist for this agent's domain to help verify the remaining LABGAME P0 gates.",
    "Facts: production backup/restore, migrations, and Edge Function release remain blocked until the recorded evidence proves otherwise. CI and local database/Auth tests never prove production readiness.",
    "Current read-only P0 gate table:",
    gateTable,
    "Return no more than two concrete checks and two blockers. Do not declare a gate approved from absent evidence."
  ].join("\n\n");
  const body = {
    model,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "lab_agent_review",
        strict: true,
        schema: agentSchema(agent.id),
      },
    },
    max_output_tokens: caps.max_output_tokens_per_call,
    store: false,
  };
  const requestBytes = Buffer.byteLength(JSON.stringify(body), "utf8");
  return { body, requestBytes };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    finishWithoutCalls("SKIPPED", "OPENAI_API_KEY is unavailable to this workflow. No key is logged or inspected.");
    return;
  }
  if (process.env.GITHUB_REF !== "refs/heads/lab-rebuild-2026") {
    finishWithoutCalls("SKIPPED", "This workflow is restricted to lab-rebuild-2026.");
    return;
  }
  if (!caps || requiredAgentIds.length !== 8 ||
      caps.max_runs_per_rolling_24h !== 1 ||
      caps.max_calls_per_run !== 8 ||
      caps.max_calls_per_agent !== 1 ||
      caps.max_output_tokens_per_call !== 128 ||
      caps.max_output_tokens_per_run !== 1024 ||
      caps.max_request_bytes_per_run !== 65536 ||
      caps.retries !== 0 || model !== "gpt-6-luna") {
    failClosed("Manifest limits differ from the implementation's safe ceiling.");
    return;
  }
  let recentRuns;
  try {
    recentRuns = await enforceDailyRunLimit();
  } catch {
    failClosed("Could not verify the rolling 24-hour call quota using read-only GitHub metadata.");
    return;
  }
  if (recentRuns >= caps.max_runs_per_rolling_24h) {
    finishWithoutCalls("SKIPPED", "Rolling 24-hour limit reached: at most one manual AI orchestration run is allowed.");
    return;
  }

  let gateTable;
  try {
    gateTable = gateTableFromReport();
  } catch {
    failClosed("The current P0 gate table is missing or contains a sensitive-data pattern.");
    return;
  }

  const agents = [];
  for (const descriptor of manifest.agents) {
    const contract = fs.readFileSync(path.join(root, ".agents", descriptor.path), "utf8");
    if (!safeForPrompt(contract)) {
      failClosed("Agent contract " + descriptor.id + " contains a blocked sensitive-data pattern.");
      return;
    }
    agents.push({ id: descriptor.id, contract });
  }
  if (agents.map((agent) => agent.id).join(",") !== requiredAgentIds.join(",")) {
    failClosed("Agent order differs from the official manifest.");
    return;
  }

  const requests = [];
  for (const agent of agents) {
    requests.push(await requestAgentReview(agent, agent.contract, gateTable));
  }
  const totalRequestBytes = requests.reduce((sum, request) => sum + request.requestBytes, 0);
  if (requests.length > caps.max_calls_per_run || totalRequestBytes > caps.max_request_bytes_per_run) {
    failClosed("Request count or encoded input bytes exceed the manifest ceiling.");
    return;
  }

  appendSummary("## Optional AI orchestration — advisory only\n\nEight agents are called sequentially. Their output cannot execute commands, change files, access production or approve a gate. Request bytes: " + totalRequestBytes + "; maximum output tokens: " + caps.max_output_tokens_per_run + ".\n");
  const notes = [];
  let outputTokens = 0;
  for (let index = 0; index < agents.length; index++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);
    let response;
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: "Bearer " + process.env.OPENAI_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(requests[index].body),
      });
    } catch {
      clearTimeout(timer);
      appendSummary("### " + escapeMarkdown(agents[index].id) + " — blocked\n\nProvider request failed or timed out; no retry was made. Remaining agents were not called.");
      process.exitCode = 1;
      return;
    }
    clearTimeout(timer);
    if (!response.ok) {
      appendSummary("### " + escapeMarkdown(agents[index].id) + " — blocked\n\nProvider returned HTTP " + response.status + "; response body was suppressed. No retry was made. Remaining agents were not called.");
      process.exitCode = 1;
      return;
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      appendSummary("### " + escapeMarkdown(agents[index].id) + " — blocked\n\nProvider response was not valid JSON. No retry was made. Remaining agents were not called.");
      process.exitCode = 1;
      return;
    }
    const text = outputText(payload);
    let note;
    try {
      note = JSON.parse(text ?? "");
    } catch {
      appendSummary("### " + escapeMarkdown(agents[index].id) + " — blocked\n\nStructured response was missing or invalid. No retry was made. Remaining agents were not called.");
      process.exitCode = 1;
      return;
    }
    if (!validateAgentOutput(note, agents[index].id)) {
      appendSummary("### " + escapeMarkdown(agents[index].id) + " — blocked\n\nStructured result failed the local schema check. Remaining agents were not called.");
      process.exitCode = 1;
      return;
    }
    const reportedOutputTokens = Number(payload?.usage?.output_tokens ?? 0);
    if (Number.isFinite(reportedOutputTokens)) outputTokens += reportedOutputTokens;
    if (outputTokens > caps.max_output_tokens_per_run) {
      appendSummary("### " + escapeMarkdown(agents[index].id) + " — blocked\n\nProvider usage exceeded the total output-token cap; remaining agents were not called.");
      process.exitCode = 1;
      return;
    }
    notes.push(note);
    appendSummary(renderNote(note));
  }
  appendSummary("AI notes are suggestions only. They are not CI evidence, production verification, or a release approval. Output tokens reported: " + outputTokens + ".");
}

main().catch(() => {
  failClosed("The orchestration stopped unexpectedly; details were suppressed.");
});
