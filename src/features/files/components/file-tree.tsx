import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { components } from "@/lib/api/schema";
import { cn } from "@/lib/utils/cn";

type FileTreeEntry = components["schemas"]["FileTreeEntry"];

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  changed?: boolean;
  depth: number;
  children: TreeNode[];
}

function buildTree(entries: FileTreeEntry[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const byPath = new Map<string, TreeNode>();

  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  for (const entry of sorted) {
    const parts = entry.path.split("/");
    const depth = parts.length - 1;
    const name = parts[parts.length - 1] ?? entry.path;
    const node: TreeNode = {
      name,
      path: entry.path,
      type: entry.type,
      ...(entry.changed !== undefined ? { changed: entry.changed } : {}),
      depth,
      children: [],
    };
    byPath.set(entry.path, node);
    const parentPath = parts.slice(0, -1).join("/");
    const parent = byPath.get(parentPath);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

interface FileTreeProps {
  projectId: string;
  commit: string;
  entries: FileTreeEntry[];
  activePath?: string;
}

export function FileTree({ projectId, commit, entries, activePath }: FileTreeProps) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (node: TreeNode): ReactNode => {
    const isCollapsed = collapsed.has(node.path);
    if (node.type === "directory") {
      return (
        <li key={node.path}>
          <button
            type="button"
            onClick={() => toggle(node.path)}
            aria-expanded={!isCollapsed}
            style={{ paddingLeft: `${node.depth * 14 + 8}px` }}
            className="text-foreground hover:bg-surface-muted flex h-7 w-full items-center gap-1.5 text-left text-[13px]"
          >
            {isCollapsed ? (
              <ChevronRight
                size={13}
                aria-hidden="true"
                className="text-muted-foreground shrink-0"
              />
            ) : (
              <ChevronDown
                size={13}
                aria-hidden="true"
                className="text-muted-foreground shrink-0"
              />
            )}
            <Folder size={13} aria-hidden="true" className="text-muted-foreground shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
          {!isCollapsed && node.children.length > 0 ? (
            <ul>{node.children.map((child) => renderNode(child))}</ul>
          ) : null}
        </li>
      );
    }
    const active = node.path === activePath;
    return (
      <li key={node.path}>
        <button
          type="button"
          onClick={() =>
            void navigate({
              to: "/projects/$projectId/files",
              params: { projectId },
              search: (prev) => ({
                ...prev,
                path: node.path,
                commit,
                startLine: undefined,
                endLine: undefined,
              }),
            })
          }
          style={{ paddingLeft: `${node.depth * 14 + 24}px` }}
          aria-current={active ? "page" : undefined}
          className={cn(
            "hover:bg-surface-muted flex h-7 w-full items-center gap-1.5 text-left text-[13px]",
            active ? "bg-surface-muted text-foreground font-medium" : "text-foreground",
          )}
        >
          <File size={13} aria-hidden="true" className="text-muted-foreground shrink-0" />
          <span className="truncate">{node.name}</span>
          {node.changed ? (
            <span
              className="bg-accent mr-2 ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
              aria-label="Changed"
            />
          ) : null}
        </button>
      </li>
    );
  };

  return (
    <ul role="tree" aria-label="File tree" className="py-1">
      {tree.map((node) => renderNode(node))}
    </ul>
  );
}
