import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

export const Tabs = BaseTabs.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={cn("border-border inline-flex h-8 items-center gap-1 border-b", className)}
      {...props}
    />
  );
}

export function TabsTab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        "text-muted-foreground data-[selected]:text-foreground data-[selected]:border-accent hover:text-foreground h-8 rounded-t-sm px-3 text-[13px] font-medium data-[selected]:border-b-2",
        className,
      )}
      {...props}
    />
  );
}

export function TabsPanel({ className, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel className={cn("pt-3 focus-visible:outline-none", className)} {...props} />;
}
