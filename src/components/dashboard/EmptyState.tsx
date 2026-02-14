import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  message: string;
  submessage?: string;
}

export function EmptyState({ message, submessage }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <InboxIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {submessage && <p className="text-xs text-muted-foreground/70">{submessage}</p>}
    </div>
  );
}
