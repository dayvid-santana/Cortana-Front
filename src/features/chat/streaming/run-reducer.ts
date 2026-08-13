import type {
  ChatMessage,
  RunEvent,
  SourceReference,
  ToolActivity,
} from "@/features/chat/streaming/types";
import type { ApiProblem } from "@/lib/api/errors";

export type RunStatus = "idle" | "connecting" | "streaming" | "completed" | "failed" | "cancelled";

export interface RunState {
  status: RunStatus;
  runId: string | null;
  threadId: string | null;
  transcript: string;
  sources: SourceReference[];
  toolActivity: ToolActivity[];
  finalMessage: ChatMessage | null;
  error: ApiProblem | null;
}

export type RunAction =
  | RunEvent
  | { type: "client.reset" }
  | { type: "client.reconnecting" }
  | { type: "client.cancelled" }
  | { type: "client.connection_lost"; message: string };

/** Before send() has ever been called — a run.started SSE event hasn't happened yet, so
 * this must not be confused with "connecting", which represents an in-flight request. */
export const initialRunState: RunState = {
  status: "idle",
  runId: null,
  threadId: null,
  transcript: "",
  sources: [],
  toolActivity: [],
  finalMessage: null,
  error: null,
};

const connectingRunState: RunState = { ...initialRunState, status: "connecting" };

function upsertTool(activity: ToolActivity[], tool: ToolActivity): ToolActivity[] {
  const index = activity.findIndex((item) => item.id === tool.id);
  if (index === -1) {
    return [...activity, tool];
  }
  const next = [...activity];
  next[index] = tool;
  return next;
}

export function runReducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case "client.reset":
      return connectingRunState;
    case "run.started":
      return { ...state, status: "streaming", runId: action.runId, threadId: action.threadId };
    case "assistant.delta":
      return { ...state, status: "streaming", transcript: state.transcript + action.text };
    case "source.reference":
      return { ...state, sources: [...state.sources, action.source] };
    case "tool.started":
    case "tool.completed":
      return { ...state, toolActivity: upsertTool(state.toolActivity, action.tool) };
    case "run.completed":
      return { ...state, status: "completed", finalMessage: action.message };
    case "run.failed":
      return { ...state, status: "failed", error: action.error };
    case "heartbeat":
      return state;
    case "client.reconnecting":
      return state.status === "completed" || state.status === "failed"
        ? state
        : { ...state, status: "connecting" };
    case "client.cancelled":
      return { ...state, status: "cancelled" };
    case "client.connection_lost":
      return state.status === "completed" || state.status === "cancelled"
        ? state
        : {
            ...state,
            status: "failed",
            error: { title: "Connection lost", status: 0, detail: action.message },
          };
    default:
      return state;
  }
}
