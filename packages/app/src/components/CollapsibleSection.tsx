import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-90",
          )}
        />
        {title}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
