import { beforeEach, describe, expect, it } from "vitest";

import { useAudioPlayerStore } from "@/stores/audio-player-store";

const segments = [
  { index: 0, text: "Section one.", audioUrl: "/audio/0" },
  { index: 1, text: "Section two.", audioUrl: "/audio/1" },
  { index: 2, text: "Section three.", audioUrl: "/audio/2" },
];

beforeEach(() => {
  useAudioPlayerStore.getState().close();
});

describe("audio-player-store", () => {
  it("starts idle with no active session", () => {
    expect(useAudioPlayerStore.getState().sessionId).toBeNull();
    expect(useAudioPlayerStore.getState().status).toBe("idle");
  });

  it("startSession loads segments and resets to the first one", () => {
    useAudioPlayerStore.getState().startSession({
      sessionId: "reading_1",
      projectId: "proj_1",
      filePath: "docs/auth.md",
      commitHash: "a17d3e1",
      voice: "voice_marin",
      mode: "narrate",
      segments,
    });
    const state = useAudioPlayerStore.getState();
    expect(state.sessionId).toBe("reading_1");
    expect(state.segments).toHaveLength(3);
    expect(state.currentSegmentIndex).toBe(0);
    expect(state.status).toBe("loading");
  });

  it("nextSegment advances the index and stays within bounds", () => {
    useAudioPlayerStore.getState().startSession({
      sessionId: "reading_1",
      projectId: "proj_1",
      filePath: "docs/auth.md",
      commitHash: "a17d3e1",
      voice: "voice_marin",
      mode: "narrate",
      segments,
    });
    useAudioPlayerStore.getState().nextSegment();
    expect(useAudioPlayerStore.getState().currentSegmentIndex).toBe(1);
  });

  it("nextSegment marks the session completed after the last segment", () => {
    useAudioPlayerStore.getState().startSession({
      sessionId: "reading_1",
      projectId: "proj_1",
      filePath: "docs/auth.md",
      commitHash: "a17d3e1",
      voice: "voice_marin",
      mode: "narrate",
      segments,
    });
    useAudioPlayerStore.getState().goToSegment(2);
    useAudioPlayerStore.getState().nextSegment();
    expect(useAudioPlayerStore.getState().status).toBe("completed");
    expect(useAudioPlayerStore.getState().currentSegmentIndex).toBe(2);
  });

  it("previousSegment never goes below zero", () => {
    useAudioPlayerStore.getState().startSession({
      sessionId: "reading_1",
      projectId: "proj_1",
      filePath: "docs/auth.md",
      commitHash: "a17d3e1",
      voice: "voice_marin",
      mode: "narrate",
      segments,
    });
    useAudioPlayerStore.getState().previousSegment();
    expect(useAudioPlayerStore.getState().currentSegmentIndex).toBe(0);
  });

  it("setRate clamps to the [0.5, 2] range", () => {
    useAudioPlayerStore.getState().setRate(5);
    expect(useAudioPlayerStore.getState().rate).toBe(2);
    useAudioPlayerStore.getState().setRate(0.1);
    expect(useAudioPlayerStore.getState().rate).toBe(0.5);
  });

  it("setVolume clamps to the [0, 1] range", () => {
    useAudioPlayerStore.getState().setVolume(3);
    expect(useAudioPlayerStore.getState().volume).toBe(1);
    useAudioPlayerStore.getState().setVolume(-1);
    expect(useAudioPlayerStore.getState().volume).toBe(0);
  });

  it("close resets playback state but does not touch rate/volume preferences", () => {
    useAudioPlayerStore.getState().setVolume(0.4);
    useAudioPlayerStore.getState().startSession({
      sessionId: "reading_1",
      projectId: "proj_1",
      filePath: "docs/auth.md",
      commitHash: "a17d3e1",
      voice: "voice_marin",
      mode: "narrate",
      segments,
    });
    useAudioPlayerStore.getState().close();
    const state = useAudioPlayerStore.getState();
    expect(state.sessionId).toBeNull();
    expect(state.segments).toEqual([]);
    expect(state.volume).toBe(0.4);
  });
});
