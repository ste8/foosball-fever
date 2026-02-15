import { useState, useEffect, useRef, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Player } from "@/types";

export function AddPlayerDialog({
  open,
  onOpenChange,
  availablePlayers,
  onAddPlayer,
  onCreatePlayer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePlayers: Player[];
  onAddPlayer: (playerId: string) => Promise<void>;
  onCreatePlayer: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setHighlightIndex(0);
    }
  }, [open]);

  const filtered = search.trim()
    ? availablePlayers.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.displayName.toLowerCase().includes(q) ||
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q)
        );
      })
    : availablePlayers;

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  function handleAdd(playerId: string) {
    startTransition(async () => {
      await onAddPlayer(playerId);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const player = filtered[highlightIndex];
      if (player) handleAdd(player.id);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const item = container.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("roster.addPlayer")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("roster.fromRegistry")}
            </h3>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("roster.searchPlaceholder")}
              disabled={isPending}
              autoFocus
            />
          </div>
          <div ref={listRef} className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                {availablePlayers.length === 0
                  ? t("players.emptyState")
                  : t("roster.searchPlaceholder")}
              </p>
            ) : (
              filtered.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50",
                    i === highlightIndex && "bg-accent",
                  )}
                  onClick={() => handleAdd(p.id)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  disabled={isPending}
                >
                  {p.displayName}
                </button>
              ))
            )}
          </div>
          <hr className="border-border" />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              onCreatePlayer();
            }}
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
            {t("roster.createNewPlayer")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
