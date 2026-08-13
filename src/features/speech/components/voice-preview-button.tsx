import { Loader2, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePreviewVoice } from "@/features/speech/hooks/use-preview-voice";

export function VoicePreviewButton({ voiceId, voiceName }: { voiceId: string; voiceName: string }) {
  const preview = usePreviewVoice();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => audioRef.current?.pause(), []);

  const handleClick = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const result = await preview.mutateAsync(voiceId);
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    audioRef.current.src = result.audioUrl;
    await audioRef.current.play();
    setPlaying(true);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void handleClick()}
      disabled={preview.isPending}
    >
      {preview.isPending ? (
        <Loader2 size={13} aria-hidden="true" className="animate-spin" />
      ) : playing ? (
        <Square size={13} aria-hidden="true" />
      ) : (
        <Play size={13} aria-hidden="true" />
      )}
      {playing ? "Stop" : "Preview"}
      <span className="visually-hidden">{voiceName}</span>
    </Button>
  );
}
