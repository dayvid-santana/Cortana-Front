import type { components } from "@/lib/api/schema";

type Project = components["schemas"]["Project"];
type Commit = components["schemas"]["Commit"];
type Decision = components["schemas"]["Decision"];
type Question = components["schemas"]["Question"];
type Provider = components["schemas"]["Provider"];
type Voice = components["schemas"]["Voice"];
type Thread = components["schemas"]["Thread"];
type Message = components["schemas"]["Message"];
type FileTreeEntry = components["schemas"]["FileTreeEntry"];

export const PROJECT_ID = "proj_acme-api";
export const HEAD_COMMIT_HASH = "a17d3e19c4f2b8a6d0e5f1c7b9a3d6e8f0c2b4a6";
export const PARENT_COMMIT_HASH = "f0c2b4a6d8e0f2c4b6a8d0e2f4c6b8a0d2e4f6c8";

export const project: Project = {
  id: PROJECT_ID,
  name: "acme-api",
  displayPath: "acme-api",
  defaultBranch: "main",
  activeBranch: "feature/auth",
  activeCommitHash: HEAD_COMMIT_HASH,
  lastScanAt: "2026-08-13T14:02:00Z",
  decisionsActiveCount: 1,
  questionsOpenCount: 1,
  dbStatus: "ready",
  createdAt: "2026-06-01T09:00:00Z",
};

export const commits: Commit[] = [
  {
    hash: HEAD_COMMIT_HASH,
    shortHash: HEAD_COMMIT_HASH.slice(0, 7),
    subject: "document authentication flow",
    message:
      "document authentication flow\n\nAdds docs/auth.md covering the JWT-based login flow and wires the\ntoken service used to issue and verify access tokens.",
    author: "Priya Natarajan",
    authoredAt: "2026-08-13T13:45:00Z",
    branch: "feature/auth",
    changedDocPaths: ["docs/auth.md", "README.md"],
    changedCodePaths: ["src/auth/token_service.py"],
    summary:
      "Documents the authentication flow end-to-end and introduces a token service. Establishes JWT as the access-token format and leaves refresh-token revocation as an open question.",
    decisionsNew: 1,
    questionsOpen: 1,
    questionsResolved: 0,
    analysisStatus: "analyzed",
    analysisProvider: "anthropic",
  },
  {
    hash: PARENT_COMMIT_HASH,
    shortHash: PARENT_COMMIT_HASH.slice(0, 7),
    subject: "scaffold auth module",
    message: "scaffold auth module",
    author: "Priya Natarajan",
    authoredAt: "2026-08-12T10:15:00Z",
    branch: "feature/auth",
    changedDocPaths: [],
    changedCodePaths: ["src/auth/__init__.py"],
    summary: "Creates an empty auth package as a landing point for the token service.",
    decisionsNew: 0,
    questionsOpen: 0,
    questionsResolved: 0,
    analysisStatus: "analyzed",
    analysisProvider: "anthropic",
  },
  {
    hash: "b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1",
    shortHash: "b3c5d7e",
    subject: "update architecture overview",
    message: "update architecture overview",
    author: "Marcus Webb",
    authoredAt: "2026-08-10T16:20:00Z",
    branch: "main",
    changedDocPaths: ["docs/architecture.md"],
    changedCodePaths: [],
    summary:
      "Refreshes the architecture diagram description to include the new auth service boundary.",
    decisionsNew: 0,
    questionsOpen: 0,
    questionsResolved: 1,
    analysisStatus: "analyzed",
    analysisProvider: "anthropic",
  },
  {
    hash: "c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2",
    shortHash: "c4d6e8f",
    subject: "initial project scaffold",
    message: "initial project scaffold",
    author: "Marcus Webb",
    authoredAt: "2026-08-05T09:00:00Z",
    branch: "main",
    changedDocPaths: ["README.md"],
    changedCodePaths: [],
    summary: "Bootstraps the repository with a README and project layout.",
    decisionsNew: 0,
    questionsOpen: 0,
    questionsResolved: 0,
    analysisStatus: "analyzed",
    analysisProvider: "anthropic",
  },
];

export const fileTree: FileTreeEntry[] = [
  { path: "README.md", type: "file", changed: true },
  { path: "docs", type: "directory" },
  { path: "docs/architecture.md", type: "file" },
  { path: "docs/auth.md", type: "file", changed: true },
  { path: "src", type: "directory" },
  { path: "src/auth", type: "directory" },
  { path: "src/auth/__init__.py", type: "file" },
  { path: "src/auth/token_service.py", type: "file", changed: true },
];

export const fileContents: Record<string, string> = {
  "docs/auth.md": `# Authentication

DevMate's API authenticates requests issued on behalf of a signed-in user
using short-lived JSON Web Tokens (JWT).

## Login flow

1. The client submits credentials to \`POST /auth/login\`.
2. The server verifies the credentials against the user store.
3. On success, the server issues an access token (15 minute lifetime) and
   a refresh token (14 day lifetime).

## Access tokens

Access tokens are signed JWTs containing the subject, issued-at, and
expiry claims. Every request to a protected endpoint must include the
access token in the \`Authorization\` header.

## Revogação

Refresh tokens are stored server-side so they can be revoked. The exact
revocation mechanism — a deny-list keyed by token ID versus short-lived
rotating tokens — has not been decided yet.
`,
  "README.md": `# acme-api

Backend API for Acme's internal tooling.

See \`docs/architecture.md\` for a system overview and \`docs/auth.md\` for
the authentication flow.
`,
  "docs/architecture.md": `# Architecture

The API is a modular monolith split into service boundaries: \`auth\`,
\`billing\`, and \`notifications\`. Each boundary owns its own database
schema and communicates with the others through in-process interfaces.
`,
  "src/auth/token_service.py": `"""Issues and verifies JWT access tokens."""
from __future__ import annotations

import time
from dataclasses import dataclass

ACCESS_TOKEN_TTL_SECONDS = 15 * 60


@dataclass
class TokenService:
    signing_key: str

    def issue_access_token(self, subject: str) -> str:
        payload = {
            "sub": subject,
            "iat": int(time.time()),
            "exp": int(time.time()) + ACCESS_TOKEN_TTL_SECONDS,
        }
        return self._encode(payload)

    def _encode(self, payload: dict[str, object]) -> str:
        # Signing implementation omitted from this excerpt.
        raise NotImplementedError
`,
  "src/auth/__init__.py": "",
};

export const decisions: Decision[] = [
  {
    id: "dec_jwt-auth",
    title: "Usar JWT para autenticação",
    description:
      "Access tokens are issued as signed JSON Web Tokens with a 15 minute lifetime, verified on every request to a protected endpoint.",
    status: "active",
    explicitness: "explicit",
    confidence: "high",
    commitHash: HEAD_COMMIT_HASH,
    filePath: "docs/auth.md",
    heading: "Access tokens",
    startLine: 14,
    endLine: 19,
    createdAt: "2026-08-13T13:45:00Z",
  },
];

export const questions: Question[] = [
  {
    id: "q_refresh-revocation",
    question: "Como os refresh tokens serão revogados?",
    status: "open",
    commitHash: HEAD_COMMIT_HASH,
    filePath: "docs/auth.md",
    heading: "Revogação",
    startLine: 21,
    endLine: 24,
    createdAt: "2026-08-13T13:45:00Z",
  },
];

export const threads: Thread[] = [
  {
    id: "thread_1",
    projectId: PROJECT_ID,
    commitHash: HEAD_COMMIT_HASH,
    scope: "docs",
    createdAt: "2026-08-13T14:00:00Z",
    updatedAt: "2026-08-13T14:05:00Z",
    messageCount: 2,
  },
];

export const seedMessages: Record<string, Message[]> = {
  thread_1: [
    {
      id: "msg_1",
      threadId: "thread_1",
      role: "user",
      content: "What did this commit change about how refresh tokens work?",
      createdAt: "2026-08-13T14:00:00Z",
      scope: "docs",
      status: "complete",
    },
    {
      id: "msg_2",
      threadId: "thread_1",
      role: "assistant",
      content:
        "This commit documents the login flow and introduces JWT access tokens " +
        "[docs/auth.md#Access tokens:L14-L19@a17d3e]. Revocation for refresh " +
        "tokens is still an open question " +
        "[docs/auth.md#Revogação:L21-L24@a17d3e].",
      createdAt: "2026-08-13T14:00:45Z",
      scope: "docs",
      provider: "anthropic",
      model: "claude-sonnet-5",
      status: "complete",
      durationMs: 3200,
      sources: [
        {
          id: "src_1",
          kind: "document",
          path: "docs/auth.md",
          commitHash: HEAD_COMMIT_HASH,
          startLine: 14,
          endLine: 19,
          heading: "Access tokens",
          label: "docs/auth.md · Access tokens · L14–19 · a17d3e",
          valid: true,
        },
        {
          id: "src_2",
          kind: "document",
          path: "docs/auth.md",
          commitHash: HEAD_COMMIT_HASH,
          startLine: 21,
          endLine: 24,
          heading: "Revogação",
          label: "docs/auth.md · Revogação · L21–24 · a17d3e",
          valid: true,
        },
      ],
      decisionsDetected: ["dec_jwt-auth"],
      questionsDetected: ["q_refresh-revocation"],
    },
  ],
};

export const providers: Provider[] = [
  {
    name: "anthropic",
    type: "remote",
    local: false,
    model: "claude-sonnet-5",
    availability: "available",
    authConfigured: true,
    capabilities: [
      "conversation",
      "structured_output",
      "streaming",
      "thread_resume",
      "repository_access",
      "tool_use",
      "code_inspection",
      "citations",
    ],
    routedTasks: [
      "commit_analysis",
      "documentation_chat",
      "code_inspection",
      "document_explanation",
    ],
  },
  {
    name: "ollama",
    type: "local",
    local: true,
    model: "qwen2.5-coder:14b",
    availability: "available",
    authConfigured: true,
    capabilities: ["conversation", "streaming", "code_inspection"],
    routedTasks: [],
  },
  {
    name: "openai",
    type: "remote",
    local: false,
    availability: "unavailable",
    authConfigured: false,
    capabilities: ["conversation", "streaming", "structured_output"],
    routedTasks: [],
  },
];

export const speechProviders: Provider[] = [
  {
    name: "openai-tts",
    type: "remote",
    local: false,
    model: "gpt-audio-mini",
    availability: "available",
    authConfigured: true,
    capabilities: ["conversation"],
    routedTasks: [],
  },
  {
    name: "piper-local",
    type: "local",
    local: true,
    availability: "available",
    authConfigured: true,
    capabilities: ["conversation"],
    routedTasks: [],
  },
];

export const voices: Voice[] = [
  {
    id: "voice_marin",
    name: "Marin",
    provider: "openai-tts",
    description: "Warm, neutral narration voice.",
    language: "en-US",
    recommended: true,
    availability: "available",
  },
  {
    id: "voice_cove",
    name: "Cove",
    provider: "openai-tts",
    description: "Calm, lower-pitched voice.",
    language: "en-US",
    recommended: false,
    availability: "available",
  },
  {
    id: "voice_amy",
    name: "Amy",
    provider: "piper-local",
    description: "Local, on-device voice — no network round trip.",
    language: "en-US",
    recommended: false,
    availability: "available",
  },
];

export const diagnostics: components["schemas"]["Diagnostics"] = {
  backendVersion: "0.4.0-mock",
  uptimeSeconds: 5400,
  database: { status: "ready", path: "~/.devmate/devmate.sqlite3" },
  providers,
  speechProviders,
};
