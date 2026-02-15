import { useState, useEffect, useTransition } from "react";
import { useParams } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RoleIcon } from "@/components/RoleIcon";
import { RoleSelect } from "@/components/RoleSelect";
import { AddPlayerDialog } from "@/components/AddPlayerDialog";
import { PlayerFormDialog } from "@/components/PlayerFormDialog";
import { useRepositories } from "@/repositories/RepositoryContext";
import type {
  Championship,
  Player,
  RosterEntryWithPlayer,
  Role,
} from "@/types";

export function Roster() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { championships, roster, players } = useRepositories();
  const [, startTransition] = useTransition();

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [entries, setEntries] = useState<RosterEntryWithPlayer[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<RosterEntryWithPlayer | null>(
    null,
  );
  const [editRole, setEditRole] = useState<Role | undefined>();
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  function reload() {
    if (!id) return;
    Promise.all([
      championships.getById(id),
      roster.getByChampionshipId(id),
      players.getNotInChampionship(id),
    ]).then(([champ, rosterEntries, available]) => {
      setChampionship(champ);
      setEntries(rosterEntries);
      setAvailablePlayers(available);
    });
  }

  useEffect(() => {
    reload();
  }, [id, championships, roster, players]);

  async function handleAddPlayer(playerId: string) {
    if (!id) return;
    await roster.addPlayer(id, playerId);
    reload();
  }

  async function handleCreateAndAdd(data: {
    firstName: string;
    lastName: string;
    displayName: string;
    preferredRole?: Role;
  }) {
    if (!id) return;
    const player = await players.create(data);
    await roster.addPlayer(id, player.id);
    reload();
  }

  function handleEntryClick(entry: RosterEntryWithPlayer) {
    setEditEntry(entry);
    setEditRole(entry.preferredRole);
  }

  function handleSaveRole() {
    if (!editEntry) return;
    startTransition(async () => {
      await roster.updatePreferredRole(editEntry.id, editRole);
      setEditEntry(null);
      reload();
    });
  }

  function handleRemoveConfirm() {
    if (!editEntry) return;
    startTransition(async () => {
      await roster.removePlayer(editEntry.id);
      setRemoveConfirmOpen(false);
      setEditEntry(null);
      reload();
    });
  }

  if (!championship) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  function getEffectiveRole(
    entry: RosterEntryWithPlayer,
  ): { role?: Role; inherited: boolean } {
    if (entry.preferredRole) {
      return { role: entry.preferredRole, inherited: false };
    }
    if (entry.player.preferredRole) {
      return { role: entry.player.preferredRole, inherited: true };
    }
    return { role: undefined, inherited: false };
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{championship.name}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("roster.playerCount", { count: entries.length })}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <RoleIcon role="defender" />
            {t("roles.defender")}
          </span>
          <span className="flex items-center gap-1">
            <RoleIcon role="attacker" />
            {t("roles.attacker")}
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-muted-foreground">{t("roster.emptyState")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("roster.emptyStateAction")}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const { role, inherited } = getEffectiveRole(entry);
            return (
              <button
                key={entry.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                onClick={() => handleEntryClick(entry)}
              >
                <RoleIcon role={role} faded={inherited} className="shrink-0" />
                <span className="font-medium">
                  {entry.player.displayName}
                </span>
                {inherited && (
                  <span className="text-xs text-muted-foreground">
                    {t("roster.inheritedPreference")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t("roster.addPlayer")}
      </Button>

      <AddPlayerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        availablePlayers={availablePlayers}
        onAddPlayer={handleAddPlayer}
        onCreatePlayer={() => setCreatePlayerOpen(true)}
      />

      <PlayerFormDialog
        open={createPlayerOpen}
        onOpenChange={setCreatePlayerOpen}
        onSave={handleCreateAndAdd}
      />

      {/* Edit roster entry dialog */}
      <Dialog
        open={!!editEntry}
        onOpenChange={(open) => {
          if (!open) setEditEntry(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editEntry?.player.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("players.preferredRole")}
              </label>
              <RoleSelect value={editRole} onChange={setEditRole} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="destructive"
              className="mr-auto"
              onClick={() => setRemoveConfirmOpen(true)}
            >
              {t("roster.removePlayer")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditEntry(null)}
            >
              {t("championship.cancel")}
            </Button>
            <Button type="button" onClick={handleSaveRole}>
              {t("championship.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("roster.removeConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("roster.removeConfirmMessage", {
                name: editEntry?.player.displayName ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("championship.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>
              {t("roster.removePlayer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
