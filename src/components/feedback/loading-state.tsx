import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  rows?: number;
  label?: string;
}

export function LoadingState({ rows = 3, label = "Loading" }: LoadingStateProps) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
