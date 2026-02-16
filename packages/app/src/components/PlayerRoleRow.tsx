import { useState } from "react";
import { cn } from "@/lib/utils";
import { RoleIcon } from "@/components/RoleIcon";
import { useSwipe } from "@/hooks/useSwipe";
import type { Role } from "@/types";

export function PlayerRoleRow({
  displayName,
  role,
  preferenceHint,
  isFocused,
  onClick,
  onSwipeLeft,
  onSwipeRight,
}: {
  displayName: string;
  role: Role | undefined; // undefined = sitting out
  preferenceHint?: Role;
  isFocused?: boolean;
  onClick: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);

  const swipeHandlers = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    onOffsetChange: setSwipeOffset,
  });

  const isSittingOut = role === undefined;

  // Swipe background color: left (negative) = defender (primary), right (positive) = attacker (destructive)
  const bgOpacity = Math.min(Math.abs(swipeOffset) / 120, 0.4);
  const swipeBg =
    swipeOffset < 0
      ? `rgba(var(--primary-rgb, 59, 130, 246), ${bgOpacity})`
      : swipeOffset > 0
        ? `rgba(var(--destructive-rgb, 239, 68, 68), ${bgOpacity})`
        : undefined;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors",
        "hover:bg-accent/50 active:bg-accent/50",
        isFocused && "ring-2 ring-ring ring-offset-1 ring-offset-background",
        isSittingOut && "opacity-60",
      )}
      style={swipeBg ? { backgroundColor: swipeBg } : undefined}
      onClick={onClick}
      {...swipeHandlers}
    >
      {isSittingOut ? (
        // Show faded preference hint when sitting out
        preferenceHint ? (
          <RoleIcon role={preferenceHint} faded className="shrink-0" />
        ) : (
          <span className="inline-block h-4 w-4 shrink-0" />
        )
      ) : (
        <RoleIcon role={role} className="shrink-0" />
      )}
      <span className="font-medium truncate">{displayName}</span>
    </button>
  );
}
