export type ReadingMode = "verbatim" | "narrate" | "explain";

export interface AudioSegment {
  index: number;
  text: string;
  audioUrl: string;
  heading?: string;
}

export interface ReadingSession {
  id: string;
  projectId: string;
  filePath: string;
  commitHash: string;
  voice: string;
  mode: ReadingMode;
  segments: AudioSegment[];
  createdAt: string;
  stale: boolean;
}

export interface CreateReadingSessionInput {
  filePath: string;
  commitHash: string;
  voice?: string;
  mode: ReadingMode;
  skipCode: boolean;
  changesOnly: boolean;
  startLine?: number;
  endLine?: number;
}
