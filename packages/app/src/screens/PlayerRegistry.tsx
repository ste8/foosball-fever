import { useState, useEffect, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleIcon } from "@/components/RoleIcon";
import { PlayerFormDialog } from "@/components/PlayerFormDialog";
import { useRepositories } from "@/repositories/RepositoryContext";
import type { PlayerWithChampionships, Role } from "@/types";

export function PlayerRegistry() {
  const { t } = useTranslation();
  const { players } = useRepositories();
  const [, startTransition] = useTransition();

  const [playerList, setPlayerList] = useState<PlayerWithChampionships[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<PlayerWithChampionships | null>(
    null,
  );
  const [canDeleteEdit, setCanDeleteEdit] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  function reload() {
    players.getAllWithChampionships().then(setPlayerList);
  }

  useEffect(() => {
    reload();
  }, [players]);

  async function handleCreate(data: {
    firstName: string;
    lastName: string;
    displayName: string;
    preferredRole?: Role;
  }) {
    await players.create(data);
    reload();
  }

  async function handleUpdate(data: {
    firstName: string;
    lastName: string;
    displayName: string;
    preferredRole?: Role;
  }) {
    if (!editPlayer) return;
    await players.update(editPlayer.id, {
      ...data,
      preferredRole: data.preferredRole ?? null,
    });
    reload();
  }

  function handleEditClick(player: PlayerWithChampionships) {
    setEditPlayer(player);
    players.isInAnyActiveRoster(player.id).then((inRoster) => {
      setCanDeleteEdit(!inRoster);
    });
  }

  async function handleDeleteRequest() {
    setDeleteConfirmOpen(true);
  }

  function handleDeleteConfirm() {
    if (!editPlayer) return;
    startTransition(async () => {
      await players.delete(editPlayer.id);
      setDeleteConfirmOpen(false);
      setEditPlayer(null);
      reload();
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("players.count", { count: playerList.length })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <RoleIcon role="attacker" />
            {t("roles.attacker")}
          </span>
          <span className="flex items-center gap-1">
            <RoleIcon role="defender" />
            {t("roles.defender")}
          </span>
        </div>
      </div>

      {playerList.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-muted-foreground">{t("players.emptyState")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("players.emptyStateAction")}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {playerList.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
              onClick={() => handleEditClick(p)}
            >
              <RoleIcon role={p.preferredRole} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium">
                  {p.firstName} {p.lastName}
                </div>
                {p.championships.length > 0 && (
                  <div className="text-xs text-muted-foreground truncate">
                    {t("players.inChampionships", {
                      names: p.championships.map((c) => c.name).join(", "),
                    })}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setCreateOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t("players.newPlayer")}
      </Button>

      <PlayerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreate}
      />

      <PlayerFormDialog
        open={!!editPlayer}
        onOpenChange={(open) => {
          if (!open) setEditPlayer(null);
        }}
        player={editPlayer ?? undefined}
        onSave={handleUpdate}
        onDelete={canDeleteEdit ? handleDeleteRequest : undefined}
        canDelete={canDeleteEdit}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("players.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("players.deleteConfirmMessage", {
                name: editPlayer
                  ? `${editPlayer.firstName} ${editPlayer.lastName}`
                  : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("championship.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t("players.deletePlayer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
