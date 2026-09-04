import { useCallback, useRef, useState } from "react";

import { speakText } from "@/features/speech/api/queries";
import { useSpeechSynthesis } from "@/features/voice/hooks/use-speech-synthesis";

interface UseServerSpeechOptions {
  lang: string;
}

/**
 * Narra texto com o provider/voz do DevMate configurados para o projeto (edge,
 * openai, elevenlabs...), em vez do `window.speechSynthesis` do navegador — que
 * ignora completamente essa configuração e soa com a voz robótica do sistema
 * operacional. Cai de volta pro navegador só se o backend falhar (provider local
 * como "system", ou o servidor fora do ar): pior qualidade, mas ainda fala algo
 * em vez de ficar em silêncio.
 */
export function useServerSpeech(projectId: string, options: UseServerSpeechOptions) {
  const fallback = useSpeechSynthesis(options);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cancel = useCallback(() => {
    audioRef.current?.pause();
    setIsSpeaking(false);
    fallback.cancel();
  }, [fallback]);

  const speak = useCallback(
    async (text: string) => {
      if (text.trim().length === 0) return;
      cancel();
      try {
        const url = await speakText(projectId, text);
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.addEventListener("ended", () => setIsSpeaking(false));
        }
        audioRef.current.src = url;
        await audioRef.current.play();
        setIsSpeaking(true);
      } catch {
        fallback.speak(text);
      }
    },
    [cancel, fallback, projectId],
  );

  return { isSpeaking: isSpeaking || fallback.isSpeaking, speak, cancel };
}
