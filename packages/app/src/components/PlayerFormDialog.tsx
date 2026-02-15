import { useState, useEffect, useTransition } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelect } from "@/components/RoleSelect";
import type { Player, Role } from "@/types";

interface PlayerFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  preferredRole?: Role;
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  player,
  onSave,
  onDelete,
  canDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player;
  onSave: (data: PlayerFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
}) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [preferredRole, setPreferredRole] = useState<Role | undefined>();

  const isEdit = !!player;

  useEffect(() => {
    if (open) {
      if (player) {
        setFirstName(player.firstName);
        setLastName(player.lastName);
        setDisplayName(player.displayName);
        setPreferredRole(player.preferredRole);
        setDisplayNameTouched(true);
      } else {
        setFirstName("");
        setLastName("");
        setDisplayName("");
        setPreferredRole(undefined);
        setDisplayNameTouched(false);
      }
    }
  }, [open, player]);

  function handleFirstNameChange(value: string) {
    setFirstName(value);
    if (!displayNameTouched) {
      setDisplayName([value, lastName].filter(Boolean).join(" "));
    }
  }

  function handleLastNameChange(value: string) {
    setLastName(value);
    if (!displayNameTouched) {
      setDisplayName([firstName, value].filter(Boolean).join(" "));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedDisplay = displayName.trim();
    if (!trimmedFirst || !trimmedLast || !trimmedDisplay) return;
    startTransition(async () => {
      await onSave({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        displayName: trimmedDisplay,
        preferredRole,
      });
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    startTransition(async () => {
      await onDelete();
      onOpenChange(false);
    });
  }

  const isValid =
    firstName.trim() && lastName.trim() && displayName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? t("players.editPlayer") : t("players.newPlayer")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("players.firstName")}</Label>
              <Input
                autoFocus
                value={firstName}
                onChange={(e) => handleFirstNameChange(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("players.lastName")}</Label>
              <Input
                value={lastName}
                onChange={(e) => handleLastNameChange(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("players.displayName")}</Label>
              <Input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setDisplayNameTouched(true);
                }}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("players.preferredRole")}</Label>
              <RoleSelect
                value={preferredRole}
                onChange={setPreferredRole}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending || !canDelete}
                className="mr-auto"
                title={!canDelete ? t("players.cannotDelete") : undefined}
              >
                {t("players.deletePlayer")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("championship.cancel")}
            </Button>
            <Button type="submit" disabled={!isValid || isPending}>
              {t("championship.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
