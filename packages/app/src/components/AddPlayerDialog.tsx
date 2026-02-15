import { useState, useEffect, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setSearch("");
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

  function handleAdd(playerId: string) {
    startTransition(async () => {
      await onAddPlayer(playerId);
    });
  }

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
              placeholder={t("roster.searchPlaceholder")}
              disabled={isPending}
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                {availablePlayers.length === 0
                  ? t("players.emptyState")
                  : t("roster.searchPlaceholder")}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                  onClick={() => handleAdd(p.id)}
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
