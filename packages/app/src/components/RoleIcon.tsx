import { Sword, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export function RoleIcon({
  role,
  className,
  faded,
}: {
  role?: Role;
  className?: string;
  faded?: boolean;
}) {
  if (role === "attacker") {
    return (
      <Sword
        className={cn(
          "h-4 w-4 text-destructive",
          faded && "opacity-40",
          className,
        )}
      />
    );
  }
  if (role === "defender") {
    return (
      <Shield
        className={cn(
          "h-4 w-4 text-primary",
          faded && "opacity-40",
          className,
        )}
      />
    );
  }
  // No preference — invisible spacer to keep alignment
  return <span className={cn("inline-block h-4 w-4", className)} />;
}
