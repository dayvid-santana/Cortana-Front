import { Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAudioElement } from "@/features/reading/hooks/use-audio-element";
import { shortHash } from "@/lib/formatting/commit";
import { useAudioPlayerStore } from "@/stores/audio-player-store";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PersistentAudioPlayer() {
  const sessionId = useAudioPlayerStore((state) => state.sessionId);
  const filePath = useAudioPlayerStore((state) => state.filePath);
  const commitHash = useAudioPlayerStore((state) => state.commitHash);
  const voice = useAudioPlayerStore((state) => state.voice);
  const status = useAudioPlayerStore((state) => state.status);
  const segments = useAudioPlayerStore((state) => state.segments);
  const currentSegmentIndex = useAudioPlayerStore((state) => state.currentSegmentIndex);
  const rate = useAudioPlayerStore((state) => state.rate);
  const errorMessage = useAudioPlayerStore((state) => state.errorMessage);
  const setStatus = useAudioPlayerStore((state) => state.setStatus);
  const setRate = useAudioPlayerStore((state) => state.setRate);
  const nextSegment = useAudioPlayerStore((state) => state.nextSegment);
  const previousSegment = useAudioPlayerStore((state) => state.previousSegment);
  const close = useAudioPlayerStore((state) => state.close);

  const { audioRef, currentTime, duration, currentSegment, handlers } = useAudioElement();

  if (!sessionId || segments.length === 0) {
    return null;
  }

  const isPlaying = status === "playing";

  return (
    <div
      role="region"
      aria-label="Document reading player"
      className="border-border bg-surface flex items-center gap-3 border-t px-3 py-2"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- spoken narration audio, no visual track to caption */}
      <audio ref={audioRef} {...handlers} />

      <Button
        variant="ghost"
        size="icon"
        onClick={previousSegment}
        disabled={currentSegmentIndex === 0}
        aria-label="Previous segment"
      >
        <SkipBack size={15} aria-hidden="true" />
      </Button>
      <Button
        variant="default"
        size="icon"
        onClick={() => setStatus(isPlaying ? "paused" : "playing")}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSegment}
        disabled={currentSegmentIndex >= segments.length - 1}
        aria-label="Next segment"
      >
        <SkipForward size={15} aria-hidden="true" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[13px] font-medium">
          {filePath} <span className="text-muted-foreground">· {voice}</span>
        </p>
        <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <span>
            Segment {currentSegmentIndex + 1}/{segments.length}
            {currentSegment?.heading ? ` · ${currentSegment.heading}` : ""}
          </span>
          {commitHash ? <span className="font-mono">· {shortHash(commitHash)}</span> : null}
          <span>
            · {formatTime(currentTime)}/{formatTime(duration)}
          </span>
          {errorMessage ? <span className="text-danger">· {errorMessage}</span> : null}
        </div>
      </div>

      <label className="text-muted-foreground flex items-center gap-1 text-[12px]">
        <Volume2 size={13} aria-hidden="true" />
        <span className="visually-hidden">Playback speed</span>
        <select
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
          className="border-border bg-background h-7 rounded-sm border px-1 text-[12px]"
        >
          {[0.75, 1, 1.25, 1.5, 2].map((value) => (
            <option key={value} value={value}>
              {value}×
            </option>
          ))}
        </select>
      </label>

      <Button variant="ghost" size="icon" onClick={close} aria-label="Close player">
        <X size={15} aria-hidden="true" />
      </Button>
    </div>
  );
}
