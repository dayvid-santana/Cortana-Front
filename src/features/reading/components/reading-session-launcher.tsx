import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/select";
import { useCreateReadingSession } from "@/features/reading/hooks/use-create-reading-session";
import type { ReadingMode } from "@/features/reading/types";
import { useVoices } from "@/features/speech/hooks/use-voices";

interface ReadingSessionLauncherProps {
  projectId: string;
  filePath: string;
  commitHash: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReadingSessionLauncher({
  projectId,
  filePath,
  commitHash,
  open,
  onOpenChange,
}: ReadingSessionLauncherProps) {
  const voices = useVoices();
  const createSession = useCreateReadingSession(projectId);
  const [mode, setMode] = useState<ReadingMode>("narrate");
  const [voiceId, setVoiceId] = useState<string>("");
  const [skipCode, setSkipCode] = useState(true);
  const [changesOnly, setChangesOnly] = useState(false);

  const handleStart = async () => {
    await createSession.mutateAsync({
      filePath,
      commitHash,
      mode,
      skipCode,
      changesOnly,
      ...(voiceId ? { voice: voiceId } : {}),
    });
    onOpenChange(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Listen to this document" description={filePath}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="reading-mode" className="text-foreground text-[13px] font-medium">
              Mode
            </label>
            <NativeSelect
              id="reading-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as ReadingMode)}
            >
              <option value="verbatim">Verbatim — read the text as written</option>
              <option value="narrate">Narrate — natural spoken phrasing</option>
              <option value="explain">Explain — summarize in plain language</option>
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="reading-voice" className="text-foreground text-[13px] font-medium">
              Voice
            </label>
            <NativeSelect
              id="reading-voice"
              value={voiceId}
              onChange={(event) => setVoiceId(event.target.value)}
            >
              <option value="">Use configured default</option>
              {voices.data?.items.map((voice) => (
                <option
                  key={voice.id}
                  value={voice.id}
                  disabled={voice.availability !== "available"}
                >
                  {voice.name} ({voice.provider})
                </option>
              ))}
            </NativeSelect>
          </div>

          <label className="text-foreground flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={skipCode}
              onChange={(event) => setSkipCode(event.target.checked)}
            />
            Skip fenced code blocks
          </label>
          <label className="text-foreground flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={changesOnly}
              onChange={(event) => setChangesOnly(event.target.checked)}
            />
            Only read what changed in this commit
          </label>

          <Button
            onClick={() => void handleStart()}
            disabled={createSession.isPending}
            className="self-start"
          >
            {createSession.isPending ? "Starting…" : "Start reading"}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
