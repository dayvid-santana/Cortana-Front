import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { AnchorHTMLAttributes } from "react";

import { isRelativeUrl, isSafeExternalUrl } from "@/lib/security/url";
import { cn } from "@/lib/utils/cn";

function SafeAnchor({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href) {
    return <span>{children}</span>;
  }
  if (isRelativeUrl(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  if (isSafeExternalUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  // Unsafe/unknown scheme (javascript:, data:, vbscript:, ...): render as inert text.
  return <span title={`Blocked unsafe link: ${href}`}>{children}</span>;
}

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders untrusted markdown (assistant messages, commit messages, decision
 * descriptions) through remark-gfm + rehype-sanitize's default schema. No
 * raw HTML is ever allowed through — see docs/web-api-gaps.md for the
 * rationale against rehype-raw.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "prose-devmate text-foreground max-w-none text-[13px] leading-relaxed",
        "[&_a]:text-accent [&_code]:bg-surface-muted [&_a]:underline [&_code]:rounded-sm [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]",
        "[&_pre]:bg-surface-muted [&_pre]:overflow-x-auto [&_pre]:rounded-sm [&_pre]:p-2",
        "[&_th]:border-border [&_td]:border-border [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2 [&_th]:py-1",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, defaultSchema]]}
        components={{ a: SafeAnchor }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
