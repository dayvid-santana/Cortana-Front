import { useCallback, useEffect, useState } from "react";

interface UseSpeechSynthesisOptions {
  lang: string;
}

interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
}

export function useSpeechSynthesis({ lang }: UseSpeechSynthesisOptions): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== "undefined" && Boolean(window.speechSynthesis);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || text.trim().length === 0) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang],
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, cancel };
}
