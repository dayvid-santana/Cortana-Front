import { Loader2, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePreviewVoice } from "@/features/speech/hooks/use-preview-voice";
import { toDisplayProblem } from "@/lib/api/errors";

export function VoicePreviewButton({ voiceId, voiceName }: { voiceId: string; voiceName: string }) {
  const preview = usePreviewVoice();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  const handleClick = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setPlaybackError(null);
    try {
      const result = await preview.mutateAsync(voiceId);
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener("ended", () => setPlaying(false));
      }
      audioRef.current.src = result.audioUrl;
      await audioRef.current.play();
      setPlaying(true);
    } catch (error) {
      // Sem isto, uma voz que não pode ser pré-visualizada (ex.: provider
      // "system", que fala no dispositivo local, não no navegador) falhava
      // sem nenhum retorno visível — o botão simplesmente não fazia nada.
      setPlaybackError(toDisplayProblem(error).detail ?? "Could not preview this voice.");
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
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
      {playbackError ? (
        <span role="alert" className="text-danger max-w-64 text-[11px]">
          {playbackError}
        </span>
      ) : null}
    </div>
  );
}
