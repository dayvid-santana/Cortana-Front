import { useVirtualizer } from "@tanstack/react-virtual";
import { Copy, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ThemedToken } from "shiki";

import { useResolvedThemeMode } from "@/app/use-resolved-theme-mode";
import { Button } from "@/components/ui/button";
import { highlightLines } from "@/lib/highlighting/shiki-highlighter";
import { cn } from "@/lib/utils/cn";

interface FileViewerProps {
  path: string;
  language: string;
  content: string;
  startLineOffset: number;
  highlightRange?: { startLine: number; endLine: number } | undefined;
  onListen?: () => void;
}

export function FileViewer({
  path,
  language,
  content,
  startLineOffset,
  highlightRange,
  onListen,
}: FileViewerProps) {
  const lines = content.split("\n");
  const themeMode = useResolvedThemeMode();
  const [tokenLines, setTokenLines] = useState<ThemedToken[][] | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTokenLines(null);
    void highlightLines(content, language, themeMode).then((tokens) => {
      if (!cancelled) setTokenLines(tokens);
    });
    return () => {
      cancelled = true;
    };
  }, [content, language, themeMode]);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 30,
  });

  useEffect(() => {
    if (!highlightRange) return;
    const targetIndex = Math.max(0, highlightRange.startLine - startLineOffset);
    virtualizer.scrollToIndex(targetIndex, { align: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightRange?.startLine, path]);

  const copyPath = () => {
    void navigator.clipboard.writeText(path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-2 border-b px-2 py-1.5">
        <span className="text-foreground truncate font-mono text-[12px]">{path}</span>
        <span className="text-muted-foreground text-[11px]">{lines.length} lines</span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copyPath}>
            <Copy size={12} aria-hidden="true" /> {copied ? "Copied" : "Copy path"}
          </Button>
          {onListen ? (
            <Button variant="ghost" size="sm" onClick={onListen}>
              <Volume2 size={12} aria-hidden="true" /> Listen
            </Button>
          ) : null}
        </div>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto font-mono text-[13px] leading-5">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const lineNumber = startLineOffset + virtualItem.index;
            const isHighlighted =
              highlightRange &&
              lineNumber >= highlightRange.startLine &&
              lineNumber <= highlightRange.endLine;
            const tokens = tokenLines?.[virtualItem.index];
            const raw = lines[virtualItem.index] ?? "";

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                id={`L${lineNumber}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                  height: virtualItem.size,
                }}
                className={cn("flex", isHighlighted && "bg-selected-line/20")}
              >
                <span className="text-muted-foreground w-12 shrink-0 pr-2 text-right select-none">
                  {lineNumber}
                </span>
                <span className="whitespace-pre">
                  {tokens
                    ? tokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} style={{ color: token.color }}>
                          {token.content}
                        </span>
                      ))
                    : raw || " "}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
