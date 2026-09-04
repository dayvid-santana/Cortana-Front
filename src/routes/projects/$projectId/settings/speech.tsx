import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, PlayCircle } from "lucide-react";
import { useRef, useState } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { VoiceCard } from "@/features/speech/components/voice-card";
import { previewVoice } from "@/features/speech/api/queries";
import { useSpeechProviders, useVoices } from "@/features/speech/hooks/use-voices";
import { useUpdateSpeechSettings } from "@/features/speech/hooks/use-update-speech-settings";
import { useProjectStatus } from "@/features/projects/hooks/use-project";
import { toDisplayProblem } from "@/lib/api/errors";

export const Route = createFileRoute("/projects/$projectId/settings/speech")({
  component: SpeechSettingsPage,
});

function SpeechSettingsPage() {
  const { projectId } = Route.useParams();
  const status = useProjectStatus(projectId);
  const speechProviders = useSpeechProviders();
  const voices = useVoices();
  const updateSettings = useUpdateSpeechSettings(projectId);

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [comparing, setComparing] = useState(false);
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleCompare = (voiceId: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(voiceId)) next.delete(voiceId);
      else next.add(voiceId);
      return next;
    });
  };

  const hasRemoteSelection = voices.data?.items.some(
    (voice) =>
      compareIds.has(voice.id) &&
      speechProviders.data?.items.find((p) => p.name === voice.provider && !p.local),
  );

  const runComparison = async () => {
    setComparing(true);
    const selected = voices.data?.items.filter((voice) => compareIds.has(voice.id)) ?? [];
    for (const voice of selected) {
      setNowPlayingId(voice.id);
      const result = await previewVoice(voice.id);
      await new Promise<void>((resolve) => {
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = result.audioUrl;
        audio.onended = () => resolve();
        void audio.play();
      });
    }
    setNowPlayingId(null);
    setComparing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Voice"
        description="Speech providers and voices used for reading documentation aloud."
      />

      {speechProviders.status === "success" ? (
        <div className="text-muted-foreground flex flex-wrap gap-2 text-[12px]">
          {speechProviders.data.items.map((provider) => (
            <span key={provider.name} className="border-border rounded-sm border px-2 py-1">
              {provider.name} · {provider.local ? "local" : "remote"} · {provider.availability}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-[12px] font-semibold tracking-wide uppercase">
          Voices
        </h2>
        {compareIds.size >= 2 ? (
          <div className="flex items-center gap-2">
            {hasRemoteSelection ? (
              <span className="text-warning inline-flex items-center gap-1 text-[12px]">
                <AlertTriangle size={12} aria-hidden="true" /> Remote voices incur provider cost
              </span>
            ) : null}
            <Button size="sm" onClick={() => void runComparison()} disabled={comparing}>
              <PlayCircle size={13} aria-hidden="true" />{" "}
              {comparing ? "Playing…" : `Compare ${compareIds.size} voices`}
            </Button>
          </div>
        ) : null}
      </div>

      {voices.status === "pending" ? <LoadingState rows={3} label="Loading voices" /> : null}
      {voices.status === "error" ? (
        <ErrorState
          problem={toDisplayProblem(voices.error)}
          onRetry={() => void voices.refetch()}
        />
      ) : null}
      {voices.status === "success" ? (
        <ul className="border-border rounded-md border">
          {voices.data.items.map((voice) => {
            const provider = speechProviders.data?.items.find((p) => p.name === voice.provider);
            return (
              <li
                key={voice.id}
                className="border-border flex items-center gap-2 border-b last:border-b-0"
              >
                <label className="pl-3">
                  <span className="visually-hidden">Select {voice.name} for comparison</span>
                  <input
                    type="checkbox"
                    checked={compareIds.has(voice.id)}
                    onChange={() => toggleCompare(voice.id)}
                  />
                </label>
                <div className="flex-1">
                  <VoiceCard
                    voice={voice}
                    selected={status.data?.defaultVoice === voice.id}
                    isLocal={provider?.local ?? false}
                    onSelect={() =>
                      updateSettings.mutate({
                        provider: voice.provider,
                        voiceId: voice.id,
                        language: voice.language,
                        // Preserva o ritmo já configurado; trocar de voz não deveria
                        // resetá-lo. O backend também mantém o valor atual se omitido.
                        rate: status.data?.defaultRate ?? 180,
                        capabilities: ["conversation"],
                      })
                    }
                  />
                </div>
                {nowPlayingId === voice.id ? (
                  <span className="text-accent mr-3 text-[11px]">Playing…</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
