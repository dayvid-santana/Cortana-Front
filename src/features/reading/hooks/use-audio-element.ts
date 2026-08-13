import { useEffect, useRef, useState } from "react";

import { useAudioPlayerStore } from "@/stores/audio-player-store";

interface AudioElementState {
  currentTime: number;
  duration: number;
}

/** Owns the real <audio> element and keeps it in sync with the Zustand playback store. */
export function useAudioElement() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [{ currentTime, duration }, setPlayback] = useState<AudioElementState>({
    currentTime: 0,
    duration: 0,
  });

  const segments = useAudioPlayerStore((state) => state.segments);
  const currentSegmentIndex = useAudioPlayerStore((state) => state.currentSegmentIndex);
  const status = useAudioPlayerStore((state) => state.status);
  const rate = useAudioPlayerStore((state) => state.rate);
  const volume = useAudioPlayerStore((state) => state.volume);
  const setStatus = useAudioPlayerStore((state) => state.setStatus);
  const nextSegment = useAudioPlayerStore((state) => state.nextSegment);
  const setError = useAudioPlayerStore((state) => state.setError);

  const currentSegment = segments[currentSegmentIndex];

  useEffect(() => {
    if (!audioRef.current || !currentSegment) return;
    audioRef.current.src = currentSegment.audioUrl;
    audioRef.current.playbackRate = rate;
    audioRef.current.volume = volume;
    if (status === "playing" || status === "loading") {
      audioRef.current.play().catch(() => setError("Playback was blocked by the browser."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSegment?.audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (status === "playing") {
      audioRef.current.play().catch(() => setError("Playback was blocked by the browser."));
    } else if (status === "paused") {
      audioRef.current.pause();
    }
  }, [status, setError]);

  return {
    audioRef,
    currentTime,
    duration,
    currentSegment,
    handlers: {
      onLoadedMetadata: () => {
        if (audioRef.current)
          setPlayback((prev) => ({ ...prev, duration: audioRef.current!.duration || 0 }));
        setStatus(status === "loading" ? "playing" : status);
      },
      onTimeUpdate: () => {
        if (audioRef.current)
          setPlayback((prev) => ({ ...prev, currentTime: audioRef.current!.currentTime }));
      },
      onEnded: () => {
        nextSegment();
      },
      onError: () => {
        setError("This segment's audio could not be loaded.");
      },
      onPlay: () => {
        if (status !== "playing") setStatus("playing");
      },
      onPause: () => {
        if (status === "playing") setStatus("paused");
      },
    },
  };
}
