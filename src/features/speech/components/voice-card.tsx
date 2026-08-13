import { Check, Cloud, HardDrive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoicePreviewButton } from "@/features/speech/components/voice-preview-button";
import type { components } from "@/lib/api/schema";

type Voice = components["schemas"]["Voice"];

interface VoiceCardProps {
  voice: Voice;
  selected: boolean;
  isLocal: boolean;
  onSelect: () => void;
}

export function VoiceCard({ voice, selected, isLocal, onSelect }: VoiceCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">{voice.name}</span>
          {voice.recommended ? <Badge variant="success">Recommended</Badge> : null}
          {isLocal ? (
            <Badge variant="outline">
              <HardDrive size={11} aria-hidden="true" /> Local
            </Badge>
          ) : (
            <Badge variant="outline">
              <Cloud size={11} aria-hidden="true" /> Remote
            </Badge>
          )}
          {voice.availability !== "available" ? <Badge variant="warning">Unavailable</Badge> : null}
        </div>
        {voice.description ? (
          <p className="text-muted-foreground mt-0.5 text-[12px]">{voice.description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <VoicePreviewButton voiceId={voice.id} voiceName={voice.name} />
        <Button
          variant={selected ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
          disabled={voice.availability !== "available"}
        >
          {selected ? <Check size={13} aria-hidden="true" /> : null}
          {selected ? "Selected" : "Select"}
        </Button>
      </div>
    </div>
  );
}
