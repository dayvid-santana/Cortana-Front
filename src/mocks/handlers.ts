import { http, HttpResponse } from "msw";

import type { components } from "@/lib/api/schema";
import { generateToneWav } from "@/mocks/audio";
import {
  HEAD_COMMIT_HASH,
  commits,
  decisions,
  diagnostics,
  fileContents,
  fileTree,
  project,
  providers,
  questions,
  seedMessages,
  speechProviders,
  threads,
  voices,
} from "@/mocks/fixtures";
import { buildRunEventScript, createSseStream } from "@/mocks/streaming";

type Project = components["schemas"]["Project"];
type Message = components["schemas"]["Message"];
type SpeechSettings = components["schemas"]["SpeechSettings"];
type ReadingSession = components["schemas"]["ReadingSession"];
type ChatRunStatus = components["schemas"]["ChatRunStatus"];

// Mirrors the same env var the API client uses, so handler paths always
// match what the client actually requests — relative in the browser
// (resolved against the page origin) and absolute under Vitest/Node, which
// has no page origin to resolve relative URLs against. See .env.test.
const API = import.meta.env.VITE_DEVMATE_API_BASE_URL ?? "/api/v1";

// ---- Mutable in-memory mock state -----------------------------------------

const projectsState: Project[] = [project];
const messagesState: Record<string, Message[]> = structuredClone(seedMessages);
let nextMessageSuffix = 1;

interface RunState {
  threadId: string;
  scope: "docs" | "code";
  status: ChatRunStatus;
  cancelled: boolean;
}
const runsState = new Map<string, RunState>();

let speechSettingsState: SpeechSettings = {
  provider: "openai-tts",
  model: "gpt-audio-mini",
  voiceId: "voice_marin",
  language: "en-US",
  rate: 1,
  capabilities: ["conversation"],
};

const readingSessionsState = new Map<string, ReadingSession>();

let scanningUntil: number | null = null;

function problem(status: number, title: string, detail?: string) {
  return HttpResponse.json({ title, status, detail }, { status });
}

function notFound(title: string) {
  return problem(404, title);
}

function findProject(projectId: string): Project | undefined {
  return projectsState.find((candidate) => candidate.id === projectId);
}

function encodeCursor(offset: number): string {
  return String(offset);
}
function decodeCursor(cursor: string | null): number {
  const parsed = Number(cursor);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function languageFromPath(path: string): string {
  const ext = path.split(".").pop() ?? "";
  const map: Record<string, string> = {
    md: "markdown",
    py: "python",
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    json: "json",
    py3: "python",
  };
  return map[ext] ?? "text";
}

function splitIntoSegments(text: string): { heading?: string | undefined; text: string }[] {
  const blocks = text.split(/\n(?=#{1,6}\s)/).filter((block) => block.trim().length > 0);
  return blocks.map((block) => {
    const headingMatch = /^#{1,6}\s+(.+)$/m.exec(block);
    return { heading: headingMatch?.[1], text: block.trim() };
  });
}

export const handlers = [
  // ---- Health / diagnostics ------------------------------------------------
  http.get(`${API}/health`, () => HttpResponse.json({ status: "ok" })),
  http.get(`${API}/diagnostics`, () => HttpResponse.json(diagnostics)),

  // ---- Projects -------------------------------------------------------------
  http.get(`${API}/projects`, () => HttpResponse.json({ items: projectsState })),

  http.post(`${API}/projects`, async ({ request }) => {
    const body = (await request.json()) as { path?: string; name?: string };
    if (!body.path || body.path.trim().length === 0) {
      return problem(400, "A repository path is required.");
    }
    if (projectsState.some((candidate) => candidate.displayPath === body.path)) {
      return problem(409, "This path is already a known project.");
    }
    const id = `proj_${body.path.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    const created: Project = {
      id,
      name: body.name ?? body.path.split(/[\\/]/).pop() ?? body.path,
      displayPath: body.path,
      defaultBranch: "main",
      activeBranch: "main",
      activeCommitHash: "",
      decisionsActiveCount: 0,
      questionsOpenCount: 0,
      dbStatus: "scanning",
      createdAt: new Date().toISOString(),
    };
    projectsState.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${API}/projects/:projectId`, ({ params }) => {
    const found = findProject(String(params.projectId));
    return found ? HttpResponse.json(found) : notFound("Project not found");
  }),

  http.get(`${API}/projects/:projectId/status`, ({ params }) => {
    const found = findProject(String(params.projectId));
    if (!found) return notFound("Project not found");
    const scanning = scanningUntil !== null && Date.now() < scanningUntil;
    return HttpResponse.json({
      projectId: found.id,
      connection: "connected",
      scanning,
      lastScanAt: found.lastScanAt,
      defaultProvider: "anthropic",
      defaultVoice: speechSettingsState.voiceId,
      activeBranch: found.activeBranch,
      activeCommitHash: found.activeCommitHash,
    });
  }),

  http.post(`${API}/projects/:projectId/scan`, ({ params }) => {
    const found = findProject(String(params.projectId));
    if (!found) return notFound("Project not found");
    scanningUntil = Date.now() + 2500;
    found.lastScanAt = new Date().toISOString();
    return HttpResponse.json(
      {
        projectId: found.id,
        connection: "connected",
        scanning: true,
        lastScanAt: found.lastScanAt,
        defaultProvider: "anthropic",
        defaultVoice: speechSettingsState.voiceId,
        activeBranch: found.activeBranch,
        activeCommitHash: found.activeCommitHash,
      },
      { status: 202 },
    );
  }),

  // ---- Commits ----------------------------------------------------------------
  http.get(`${API}/projects/:projectId/commits`, ({ params, request }) => {
    const found = findProject(String(params.projectId));
    if (!found) return notFound("Project not found");
    const url = new URL(request.url);
    const branch = url.searchParams.get("branch");
    const status = url.searchParams.get("status");
    const limit = Number(url.searchParams.get("limit") ?? "30");
    const offset = decodeCursor(url.searchParams.get("cursor"));

    const filtered = commits.filter(
      (commit) =>
        (!branch || commit.branch === branch) && (!status || commit.analysisStatus === status),
    );
    const page = filtered.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    return HttpResponse.json({
      items: page,
      nextCursor: nextOffset < filtered.length ? encodeCursor(nextOffset) : undefined,
    });
  }),

  http.get(`${API}/projects/:projectId/commits/:commitHash`, ({ params }) => {
    const commit = commits.find((candidate) => candidate.hash === params.commitHash);
    return commit ? HttpResponse.json(commit) : notFound("Commit not found");
  }),

  // ---- Files --------------------------------------------------------------------
  http.get(`${API}/projects/:projectId/files`, () => HttpResponse.json({ items: fileTree })),

  http.get(`${API}/projects/:projectId/files/content`, ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";
    const commit = url.searchParams.get("commit") ?? HEAD_COMMIT_HASH;
    const full = fileContents[path];
    if (full === undefined) return notFound(`File not found: ${path}`);

    const allLines = full.split("\n");
    const startLine = Number(url.searchParams.get("startLine") ?? "1");
    const endLine = Number(url.searchParams.get("endLine") ?? String(allLines.length));
    const clampedStart = Math.max(1, startLine);
    const clampedEnd = Math.min(allLines.length, endLine);
    const content =
      url.searchParams.has("startLine") || url.searchParams.has("endLine")
        ? allLines.slice(clampedStart - 1, clampedEnd).join("\n")
        : full;

    return HttpResponse.json({
      path,
      commitHash: commit,
      language: languageFromPath(path),
      sizeBytes: new TextEncoder().encode(full).length,
      lineCount: allLines.length,
      truncated: false,
      content,
      startLine: url.searchParams.has("startLine") ? clampedStart : 1,
      endLine: url.searchParams.has("endLine") ? clampedEnd : allLines.length,
    });
  }),

  http.get(`${API}/projects/:projectId/files/diff`, ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";
    const commit = url.searchParams.get("commit") ?? HEAD_COMMIT_HASH;

    if (path === "docs/auth.md") {
      return HttpResponse.json({
        oldPath: "docs/auth.md",
        newPath: "docs/auth.md",
        status: "added",
        commitHash: commit,
        parentHash: undefined,
        additions: 22,
        deletions: 0,
        hunks: [
          {
            header: "@@ -0,0 +1,22 @@",
            lines: fileContents["docs/auth.md"]?.split("\n").map((line, index) => ({
              type: "added" as const,
              content: line,
              newLineNumber: index + 1,
            })),
          },
        ],
      });
    }
    if (path === "src/auth/token_service.py") {
      return HttpResponse.json({
        oldPath: undefined,
        newPath: "src/auth/token_service.py",
        status: "added",
        commitHash: commit,
        parentHash: undefined,
        additions: 20,
        deletions: 0,
        hunks: [
          {
            header: "@@ -0,0 +1,20 @@",
            lines: fileContents["src/auth/token_service.py"]?.split("\n").map((line, index) => ({
              type: "added" as const,
              content: line,
              newLineNumber: index + 1,
            })),
          },
        ],
      });
    }
    return notFound(`No diff available for ${path} at this commit`);
  }),

  // ---- Decisions ------------------------------------------------------------------
  http.get(`${API}/projects/:projectId/decisions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const explicitness = url.searchParams.get("explicitness");
    const items = decisions.filter(
      (decision) =>
        (!status || decision.status === status) &&
        (!explicitness || decision.explicitness === explicitness),
    );
    return HttpResponse.json({ items });
  }),

  http.get(`${API}/projects/:projectId/decisions/:decisionId`, ({ params }) => {
    const decision = decisions.find((candidate) => candidate.id === params.decisionId);
    if (!decision) return notFound("Decision not found");
    return HttpResponse.json({
      ...decision,
      supersededByIds: [],
      relatedCommitHashes: [decision.commitHash],
      relatedQuestionIds: questions
        .filter((q) => q.commitHash === decision.commitHash)
        .map((q) => q.id),
    });
  }),

  // ---- Questions ------------------------------------------------------------------
  http.get(`${API}/projects/:projectId/questions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const items = questions.filter((question) => !status || question.status === status);
    return HttpResponse.json({ items });
  }),

  http.get(`${API}/projects/:projectId/questions/:questionId`, ({ params }) => {
    const question = questions.find((candidate) => candidate.id === params.questionId);
    return question ? HttpResponse.json(question) : notFound("Question not found");
  }),

  // ---- Threads / messages -----------------------------------------------------------
  http.get(`${API}/projects/:projectId/threads`, ({ request }) => {
    const url = new URL(request.url);
    const commit = url.searchParams.get("commit");
    const items = threads.filter((thread) => !commit || thread.commitHash === commit);
    return HttpResponse.json({ items });
  }),

  http.get(`${API}/projects/:projectId/threads/:threadId/messages`, ({ params }) => {
    const threadId = String(params.threadId);
    const items = messagesState[threadId] ?? [];
    return HttpResponse.json({ items, nextCursor: undefined });
  }),

  // ---- Chat runs (streamed via SSE) ---------------------------------------------------
  http.post(`${API}/projects/:projectId/chat/runs`, async ({ request }) => {
    const body = (await request.json()) as {
      threadId?: string;
      commitHash: string;
      scope: "docs" | "code";
      message: string;
    };
    const threadId = body.threadId ?? threads[0]?.id ?? "thread_1";
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    nextMessageSuffix += 1;
    const userMessage: Message = {
      id: `msg_${threadId}_${nextMessageSuffix}`,
      threadId,
      role: "user",
      content: body.message,
      createdAt: new Date().toISOString(),
      scope: body.scope,
      status: "complete",
    };
    messagesState[threadId] = [...(messagesState[threadId] ?? []), userMessage];

    runsState.set(runId, { threadId, scope: body.scope, status: "running", cancelled: false });

    return HttpResponse.json({ id: runId, threadId, status: "running" }, { status: 202 });
  }),

  http.get(`${API}/runs/:runId`, ({ params }) => {
    const run = runsState.get(String(params.runId));
    if (!run) return notFound("Run not found");
    return HttpResponse.json({ id: params.runId, threadId: run.threadId, status: run.status });
  }),

  http.get(`${API}/runs/:runId/events`, ({ params, request }) => {
    const runId = String(params.runId);
    const run = runsState.get(runId);
    if (!run) return notFound("Run not found");

    const lastUserMessage = [...(messagesState[run.threadId] ?? [])]
      .reverse()
      .find((m) => m.role === "user");
    const script = buildRunEventScript({
      runId,
      threadId: run.threadId,
      scope: run.scope,
      userMessage: lastUserMessage?.content ?? "",
    });

    const stream = createSseStream(script, {
      isCancelled: () => runsState.get(runId)?.cancelled ?? false,
      onComplete: () => {
        const finalEvent = script.at(-1);
        const current = runsState.get(runId);
        if (!current) return;
        if (finalEvent?.type === "run.completed") {
          messagesState[run.threadId] = [
            ...(messagesState[run.threadId] ?? []),
            finalEvent.message,
          ];
          runsState.set(runId, { ...current, status: "completed" });
        }
      },
    });

    request.signal.addEventListener("abort", () => {
      const current = runsState.get(runId);
      if (current) runsState.set(runId, { ...current, cancelled: true });
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }),

  http.post(`${API}/runs/:runId/cancel`, ({ params }) => {
    const runId = String(params.runId);
    const run = runsState.get(runId);
    if (!run) return notFound("Run not found");
    runsState.set(runId, { ...run, cancelled: true, status: "cancelled" });
    return HttpResponse.json({ id: runId, threadId: run.threadId, status: "cancelled" });
  }),

  // ---- Providers --------------------------------------------------------------------------
  http.get(`${API}/providers`, () => HttpResponse.json({ items: providers })),
  http.get(`${API}/providers/:providerName`, ({ params }) => {
    const found = providers.find((provider) => provider.name === params.providerName);
    return found ? HttpResponse.json(found) : notFound("Provider not found");
  }),
  http.put(`${API}/projects/:projectId/settings/providers`, ({ params }) => {
    const found = findProject(String(params.projectId));
    if (!found) return notFound("Project not found");
    return HttpResponse.json({
      projectId: found.id,
      connection: "connected",
      scanning: false,
      lastScanAt: found.lastScanAt,
      defaultProvider: "anthropic",
      defaultVoice: speechSettingsState.voiceId,
      activeBranch: found.activeBranch,
      activeCommitHash: found.activeCommitHash,
    });
  }),

  // ---- Speech / voices --------------------------------------------------------------------
  http.get(`${API}/speech/providers`, () => HttpResponse.json({ items: speechProviders })),
  http.get(`${API}/speech/voices`, ({ request }) => {
    const url = new URL(request.url);
    const providerFilter = url.searchParams.get("provider");
    const items = voices.filter((voice) => !providerFilter || voice.provider === providerFilter);
    return HttpResponse.json({ items });
  }),
  http.post(`${API}/speech/voices/preview`, async ({ request }) => {
    const body = (await request.json()) as { voiceId: string };
    return HttpResponse.json({
      voiceId: body.voiceId,
      audioUrl: `${API}/mock-audio/preview/${encodeURIComponent(body.voiceId)}.wav`,
    });
  }),
  http.get(`${API}/mock-audio/preview/:voiceId`, ({ params }) => {
    const voiceId = String(params.voiceId).replace(/\.wav$/, "");
    const frequency = 300 + (voiceId.length % 8) * 40;
    return new HttpResponse(generateToneWav(2, frequency), {
      headers: { "Content-Type": "audio/wav" },
    });
  }),
  http.put(`${API}/projects/:projectId/settings/speech`, async ({ request }) => {
    const body = (await request.json()) as SpeechSettings;
    speechSettingsState = body;
    return HttpResponse.json(speechSettingsState);
  }),

  // ---- Reading sessions --------------------------------------------------------------------
  http.post(`${API}/projects/:projectId/reading-sessions`, async ({ params, request }) => {
    const projectId = String(params.projectId);
    const body = (await request.json()) as {
      filePath: string;
      commitHash: string;
      voice?: string;
      mode: "verbatim" | "narrate" | "explain";
    };
    const text = fileContents[body.filePath];
    if (text === undefined) return notFound(`File not found: ${body.filePath}`);

    const sessionId = `reading_${Date.now()}`;
    const segments = splitIntoSegments(text).map((segment, index) => ({
      index,
      text: segment.text,
      ...(segment.heading !== undefined ? { heading: segment.heading } : {}),
      audioUrl: `${API}/reading-sessions/${sessionId}/segments/${index}/audio`,
    }));

    const session: ReadingSession = {
      id: sessionId,
      projectId,
      filePath: body.filePath,
      commitHash: body.commitHash,
      voice: body.voice ?? speechSettingsState.voiceId,
      mode: body.mode,
      segments,
      createdAt: new Date().toISOString(),
      stale: false,
    };
    readingSessionsState.set(sessionId, session);
    return HttpResponse.json(session, { status: 201 });
  }),

  http.get(`${API}/reading-sessions/:sessionId`, ({ params }) => {
    const session = readingSessionsState.get(String(params.sessionId));
    return session ? HttpResponse.json(session) : notFound("Reading session not found");
  }),

  http.post(`${API}/reading-sessions/:sessionId/stop`, ({ params }) => {
    const exists = readingSessionsState.has(String(params.sessionId));
    if (!exists) return notFound("Reading session not found");
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/reading-sessions/:sessionId/segments/:index/audio`, ({ params }) => {
    const session = readingSessionsState.get(String(params.sessionId));
    const index = Number(params.index);
    const segment = session?.segments[index];
    if (!segment) return notFound("Segment not found");
    const durationSeconds = Math.min(12, Math.max(2, segment.text.length / 20));
    return new HttpResponse(generateToneWav(durationSeconds, 320), {
      headers: { "Content-Type": "audio/wav" },
    });
  }),
];
