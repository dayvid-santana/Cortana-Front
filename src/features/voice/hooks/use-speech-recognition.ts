import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/**
 * Push-to-talk, not continuous listening: `continuous = false` means the browser stops
 * itself once the person stops speaking, and this hook never restarts it automatically
 * after a turn — restarting right after the assistant's spoken reply risks the speaker
 * output leaking into the mic and triggering another recognition.
 */
export function useSpeechRecognition({
  lang,
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  const Ctor = getSpeechRecognitionConstructor();
  const isSupported = Ctor !== undefined;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!Ctor || recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript.trim();
      if (last?.isFinal && transcript) {
        onResultRef.current(transcript);
      }
    };
    recognition.onerror = (event) => {
      onErrorRef.current?.(event.message || event.error);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [Ctor, lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { isSupported, isListening, start, stop };
}
