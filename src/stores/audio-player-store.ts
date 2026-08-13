import { create } from "zustand";

import type { AudioSegment, ReadingMode } from "@/features/reading/types";

export type AudioPlayerStatus = "idle" | "loading" | "playing" | "paused" | "completed" | "error";

interface AudioPlayerState {
  sessionId: string | null;
  projectId: string | null;
  filePath: string | null;
  commitHash: string | null;
  voice: string | null;
  mode: ReadingMode | null;
  status: AudioPlayerStatus;
  segments: AudioSegment[];
  currentSegmentIndex: number;
  rate: number;
  volume: number;
  errorMessage: string | null;

  startSession: (session: {
    sessionId: string;
    projectId: string;
    filePath: string;
    commitHash: string;
    voice: string;
    mode: ReadingMode;
    segments: AudioSegment[];
  }) => void;
  setStatus: (status: AudioPlayerStatus) => void;
  setError: (message: string) => void;
  goToSegment: (index: number) => void;
  nextSegment: () => void;
  previousSegment: () => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  close: () => void;
}

const initialPlaybackState = {
  sessionId: null,
  projectId: null,
  filePath: null,
  commitHash: null,
  voice: null,
  mode: null,
  status: "idle" as const,
  segments: [],
  currentSegmentIndex: 0,
  errorMessage: null,
};

/**
 * Transient player state only. Audio bytes are never stored here — segments
 * carry a streamable `audioUrl` served by the backend; this store just
 * tracks which segment is active and playback controls (see
 * PersistentAudioPlayer, which owns the actual <audio> element).
 */
export const useAudioPlayerStore = create<AudioPlayerState>()((set, get) => ({
  ...initialPlaybackState,
  rate: 1,
  volume: 1,

  startSession: (session) => {
    set({
      ...initialPlaybackState,
      sessionId: session.sessionId,
      projectId: session.projectId,
      filePath: session.filePath,
      commitHash: session.commitHash,
      voice: session.voice,
      mode: session.mode,
      segments: session.segments,
      status: "loading",
    });
  },
  setStatus: (status) => {
    set({ status });
  },
  setError: (message) => {
    set({ status: "error", errorMessage: message });
  },
  goToSegment: (index) => {
    const { segments } = get();
    if (index < 0 || index >= segments.length) {
      return;
    }
    set({ currentSegmentIndex: index });
  },
  nextSegment: () => {
    const { currentSegmentIndex, segments } = get();
    if (currentSegmentIndex + 1 < segments.length) {
      set({ currentSegmentIndex: currentSegmentIndex + 1 });
    } else {
      set({ status: "completed" });
    }
  },
  previousSegment: () => {
    const { currentSegmentIndex } = get();
    if (currentSegmentIndex > 0) {
      set({ currentSegmentIndex: currentSegmentIndex - 1 });
    }
  },
  setRate: (rate) => {
    set({ rate: Math.min(Math.max(rate, 0.5), 2) });
  },
  setVolume: (volume) => {
    set({ volume: Math.min(Math.max(volume, 0), 1) });
  },
  close: () => {
    set({ ...initialPlaybackState });
  },
}));
