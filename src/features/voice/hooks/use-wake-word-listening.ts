import { useCallback, useEffect, useRef, useState } from "react";

interface UseWakeWordListeningOptions {
  lang: string;
  /** Palavra de ativação; casada sem diferenciar maiúsculas, como palavra inteira. */
  wakeWord?: string;
  /** Liga/desliga a escuta contínua por completo (o botão de microfone da interface). */
  enabled: boolean;
  /**
   * Pausa a escuta sem desligá-la — usado enquanto a assistente está falando, pra
   * evitar que o áudio dela mesma reative o reconhecimento (efeito Larsen de voz).
   */
  paused: boolean;
  onCommand: (command: string) => void;
  onError?: (message: string) => void;
}

interface UseWakeWordListeningResult {
  isSupported: boolean;
  /** true assim que a escuta contínua está de pé, mesmo sem ter ouvido "Diana" ainda. */
  isListening: boolean;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/** Extrai o que vem depois da palavra de ativação; `null` se ela não aparecer na fala. */
export function extractCommandAfterWakeWord(transcript: string, wakeWord: string): string | null {
  const pattern = new RegExp(`\\b${wakeWord}\\b`, "i");
  const match = pattern.exec(transcript);
  if (!match) return null;
  return transcript.slice(match.index + match[0].length).trim();
}

/**
 * Escuta contínua: fica sempre ouvindo enquanto `enabled` for true, mas só age
 * quando a palavra de ativação aparece na fala — o resto é descartado. Diferente de
 * `useSpeechRecognition` (push-to-talk, uma rodada por clique).
 */
export function useWakeWordListening({
  lang,
  wakeWord = "cortana",
  enabled,
  paused,
  onCommand,
  onError,
}: UseWakeWordListeningOptions): UseWakeWordListeningResult {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wakeWordRef = useRef(wakeWord);
  const onCommandRef = useRef(onCommand);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    wakeWordRef.current = wakeWord;
    onCommandRef.current = onCommand;
    onErrorRef.current = onError;
  }, [wakeWord, onCommand, onError]);

  const Ctor = getSpeechRecognitionConstructor();
  const isSupported = Ctor !== undefined;

  const stop = useCallback(() => {
    if (restartTimeoutRef.current !== null) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => {
    // Nada a fazer aqui: o cleanup do efeito anterior (abaixo) já aborta e limpa
    // qualquer reconhecimento em andamento antes deste corpo rodar de novo.
    if (!Ctor || !enabled || paused) return;
    if (recognitionRef.current) return; // já está escutando

    let cancelled = false;

    const startOnce = () => {
      if (cancelled || !enabled || paused) return;
      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript.trim();
          if (!result?.isFinal || !transcript) continue;
          const command = extractCommandAfterWakeWord(transcript, wakeWordRef.current);
          if (command) onCommandRef.current(command);
        }
      };
      recognition.onerror = (event) => {
        // "no-speech" e "aborted" são o normal de uma escuta contínua (silêncio
        // entre comandos, ou o próprio stop() chamado por este hook) — só erros
        // reais (ex.: permissão negada) valem a pena reportar.
        if (event.error === "no-speech" || event.error === "aborted") return;
        onErrorRef.current?.(event.message || event.error);
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        if (cancelled || !enabled || paused) {
          setIsListening(false);
          return;
        }
        // O navegador encerra reconhecimentos contínuos periodicamente por conta
        // própria; reinicia automaticamente enquanto o modo de voz continuar ligado.
        restartTimeoutRef.current = setTimeout(startOnce, 250);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    };

    startOnce();

    return () => {
      cancelled = true;
      stop();
    };
  }, [Ctor, enabled, paused, lang, stop]);

  return { isSupported, isListening };
}
