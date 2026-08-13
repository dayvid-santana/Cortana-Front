import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { ProjectSidebar } from "@/components/layout/project-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { SheetContent, SheetRoot } from "@/components/ui/sheet";

interface AppShellProps {
  projectId: string;
  projectName?: string;
  branch?: string;
  commitHash?: string;
  commitSubjectText?: string;
  decisionsActiveCount?: number | undefined;
  questionsOpenCount?: number | undefined;
  children: ReactNode;
}

export function AppShell({
  projectId,
  projectName,
  branch,
  commitHash,
  commitSubjectText,
  decisionsActiveCount,
  questionsOpenCount,
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        {...(projectName !== undefined ? { projectName } : {})}
        projectId={projectId}
        {...(branch !== undefined ? { branch } : {})}
        {...(commitHash !== undefined ? { commitHash } : {})}
        {...(commitSubjectText !== undefined ? { commitSubjectText } : {})}
      />
      <div className="flex min-h-0 flex-1">
        <div className="border-border hidden shrink-0 border-r lg:block">
          <ProjectSidebar
            projectId={projectId}
            {...(decisionsActiveCount !== undefined ? { decisionsActiveCount } : {})}
            {...(questionsOpenCount !== undefined ? { questionsOpenCount } : {})}
          />
        </div>

        <div className="flex items-start p-1 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={16} aria-hidden="true" />
          </Button>
        </div>
        <SheetRoot open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent title="Project navigation" side="left">
            <ProjectSidebar
              projectId={projectId}
              forceExpanded
              {...(decisionsActiveCount !== undefined ? { decisionsActiveCount } : {})}
              {...(questionsOpenCount !== undefined ? { questionsOpenCount } : {})}
            />
          </SheetContent>
        </SheetRoot>

        <main id="main-content" className="min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
