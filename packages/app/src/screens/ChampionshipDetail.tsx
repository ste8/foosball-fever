import { useState, useEffect, useTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRepositories } from "@/repositories/RepositoryContext";
import { useFormatDate } from "@/hooks/useFormatDate";
import type { Championship, MatchDay } from "@/types";

export function ChampionshipDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formatDate = useFormatDate();
  const { championships, matchDays: matchDayRepo } = useRepositories();
  const [isPending, startTransition] = useTransition();

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [stats, setStats] = useState<{
    matchDayCount: number;
    playerCount: number;
    lastPlayedAt?: string;
  } | null>(null);
  const [recentMatchDays, setRecentMatchDays] = useState<MatchDay[]>([]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      championships.getById(id),
      championships.getStatsById(id),
      matchDayRepo.getByChampionshipId(id),
    ]).then(([champ, champStats, days]) => {
      setChampionship(champ);
      setStats(champStats);
      setRecentMatchDays(days.slice(0, 3));
    });
  }, [id, championships, matchDayRepo]);

  if (!championship || !stats) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  const isArchived = !!championship.archivedAt;

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = renameName.trim();
    if (!trimmed || !id) return;
    startTransition(async () => {
      const updated = await championships.update(id, { name: trimmed });
      setChampionship(updated);
      setRenameOpen(false);
    });
  }

  function handleArchiveToggle() {
    if (!id) return;
    startTransition(async () => {
      if (isArchived) {
        await championships.unarchive(id);
      } else {
        await championships.archive(id);
      }
      navigate("/");
    });
  }

  function handleDelete() {
    if (!id) return;
    startTransition(async () => {
      await championships.delete(id);
      navigate("/");
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{championship.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("championship.stats", {
              players: stats.playerCount,
              matchDays: stats.matchDayCount,
            })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setRenameName(championship.name);
                setRenameOpen(true);
              }}
            >
              {t("championship.rename")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchiveToggle}>
              {isArchived
                ? t("championship.unarchive")
                : t("championship.archive")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              {t("championship.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        className="w-full"
        onClick={() => navigate(`/championships/${id}/match-days/new`)}
      >
        <Plus className="h-4 w-4" />
        {t("championship.newMatchDay")}
      </Button>

      {recentMatchDays.length > 0 && (
        <>
          <hr className="border-border" />

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("championship.recentMatchDays")}
            </h2>
            {recentMatchDays.map((md) => (
              <button
                key={md.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50"
                onClick={() =>
                  navigate(`/championships/${id}/match-days/${md.id}`)
                }
              >
                <div>
                  <span className="font-medium">
                    {t("championship.matchDayItem", {
                      number: md.matchDayNumber,
                    })}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    — {formatDate(md.playedAt)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {t("championship.matchDayTeams", { count: md.teamCount ?? 0 })}
                </span>
              </button>
            ))}
            <Button
              variant="link"
              className="w-full"
              onClick={() => navigate(`/championships/${id}/match-days`)}
            >
              {t("championship.viewAllMatchDays")}
            </Button>
          </div>
        </>
      )}

      <hr className="border-border" />

      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate(`/championships/${id}/roster`)}
      >
        {t("championship.manageRoster")}
      </Button>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>{t("championship.renameTitle")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                autoFocus
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                placeholder={t("championship.renamePlaceholder")}
                disabled={isPending}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
                disabled={isPending}
              >
                {t("championship.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!renameName.trim() || isPending}
              >
                {t("championship.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("championship.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("championship.deleteMessage", { name: championship.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t("championship.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {t("championship.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
