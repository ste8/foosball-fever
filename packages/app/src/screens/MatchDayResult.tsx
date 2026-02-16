import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  useParams,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { RefreshCw, Check, Loader2, MoreVertical } from "lucide-react";
import { generateTeams } from "@foosball-fever/team-generator";
import type {
  GenerationResult,
  MatchDayHistory,
} from "@foosball-fever/team-generator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GeneratingDialog } from "@/components/GeneratingDialog";
import { RoleIcon } from "@/components/RoleIcon";
import { useRepositories } from "@/repositories/RepositoryContext";
import { useFormatDate } from "@/hooks/useFormatDate";
import type { LayoutContext } from "@/components/Layout";
import type { MatchDayWithTeams } from "@/types";

interface ResultState {
  result: GenerationResult;
  championshipId: string;
  championshipName: string;
  matchDayNumber: number;
  history: MatchDayHistory[];
  attackerIds: string[];
  defenderIds: string[];
  playerMap: Record<string, string>;
}

export function MatchDayResult() {
  const { id, matchDayId } = useParams<{ id: string; matchDayId?: string }>();
  const location = useLocation();

  const state = location.state as ResultState | null;

  // Preview mode: coming from generation
  if (state?.result) {
    return <PreviewMode state={state} />;
  }

  // Read-only mode: saved match day
  if (matchDayId) {
    return <ReadOnlyMode matchDayId={matchDayId} championshipId={id!} />;
  }

  // Direct URL access with no state — redirect
  return <RedirectToChampionship id={id!} />;
}

function RedirectToChampionship({ id }: { id: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/championships/${id}`, { replace: true });
  }, [id, navigate]);
  return null;
}

function PreviewMode({ state }: { state: ResultState }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formatDate = useFormatDate();
  const { matchDays: matchDayRepo } = useRepositories();

  const [result, setResult] = useState(state.result);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setBeforeBack } = useOutletContext<LayoutContext>();

  const {
    championshipId,
    championshipName,
    matchDayNumber,
    history,
    attackerIds,
    defenderIds,
    playerMap,
  } = state;

  const today = new Date().toISOString().slice(0, 10);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Intercept header back button with discard confirmation
  useEffect(() => {
    setBeforeBack(() => () => setDiscardOpen(true));
    return () => setBeforeBack(null);
  }, [setBeforeBack]);

  function handleDiscard() {
    setDiscardOpen(false);
    setBeforeBack(null);
    navigate(-1);
  }

  function handleRegenerate() {
    const seed = Math.floor(Math.random() * 2147483647);
    const input = { attackerIds, defenderIds, history, seed };

    setGenerating(true);

    try {
      const worker = new Worker(
        new URL("../workers/generateTeams.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === "done") {
          cleanup();
          setResult(e.data.result);
        }
      };

      worker.onerror = () => {
        cleanup();
        const fallback = generateTeams(input);
        setResult(fallback);
      };

      worker.postMessage(input);

      timeoutRef.current = setTimeout(() => {
        worker.terminate();
        workerRef.current = null;
        setGenerating(false);
        const fallback = generateTeams(input);
        setResult(fallback);
      }, 5000);
    } catch {
      setGenerating(false);
      const fallback = generateTeams(input);
      setResult(fallback);
    }
  }

  function handleStopGeneration() {
    workerRef.current?.terminate();
    cleanup();
    const seed = Math.floor(Math.random() * 2147483647);
    const fallback = generateTeams({
      attackerIds,
      defenderIds,
      history,
      seed,
    });
    setResult(fallback);
  }

  function cleanup() {
    workerRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setGenerating(false);
  }

  async function handleAccept() {
    const teams = result.teams.map((team) => ({
      attackerId: team.attackerId,
      defenderId: team.defenderId,
      teamNumber: team.teamNumber,
    }));

    setSaving(true);
    try {
      await matchDayRepo.create(championshipId, matchDayNumber, today, teams);
      // Let useEffect cleanup clear beforeBack on unmount.
      // Navigate on next tick so React finishes the current render cycle first.
      setTimeout(() => {
        navigate(`/championships/${championshipId}`, { replace: true });
      }, 0);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground">{championshipName}</p>
          <h1 className="text-2xl font-bold">
            {t("matchDay.resultTitle", { number: matchDayNumber })}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
        </div>

        {/* Metrics bar */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>
            {t("matchDay.calculationTime", {
              ms: result.metrics.calculationTimeMs,
            })}
          </span>
          <span>
            {t("matchDay.freshMatchDays", {
              count: result.metrics.freshMatchDays,
            })}
          </span>
          <span>
            {t("matchDay.repeatedCount", {
              repeated: result.metrics.repeatedCount,
              total: result.metrics.totalCount,
            })}
          </span>
        </div>

        {/* Team table */}
        <div className="space-y-1.5">
          {result.teams.map((team) => (
            <div
              key={team.teamNumber}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                {team.teamNumber}
              </span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <RoleIcon role="defender" className="shrink-0" />
                <span className="truncate">
                  {playerMap[team.defenderId] ?? team.defenderId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <RoleIcon role="attacker" className="shrink-0" />
                <span className="truncate">
                  {playerMap[team.attackerId] ?? team.attackerId}
                </span>
              </div>
              {team.lastOccurrence !== undefined && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t("matchDay.repeated", { count: team.lastOccurrence })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky bottom actions */}
      <div className="sticky bottom-0 border-t bg-background p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRegenerate}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4" />
            {t("matchDay.regenerate")}
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saving ? t("matchDay.saving") : t("matchDay.accept")}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <GeneratingDialog open={generating} onStop={handleStopGeneration} />

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("matchDay.discardConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("matchDay.discardConfirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("matchDay.keepViewing")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>
              {t("matchDay.discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReadOnlyMode({
  matchDayId,
  championshipId,
}: {
  matchDayId: string;
  championshipId: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formatDate = useFormatDate();
  const { matchDays: matchDayRepo } = useRepositories();

  const [matchDay, setMatchDay] = useState<MatchDayWithTeams | null>(null);
  const [isLast, setIsLast] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      matchDayRepo.getById(matchDayId),
      matchDayRepo.getByChampionshipId(championshipId),
    ]).then(([md, allDays]) => {
      if (!md) {
        navigate(`/championships/${championshipId}`, { replace: true });
        return;
      }
      setMatchDay(md);
      // allDays is ordered by matchDayNumber DESC — first is the latest
      setIsLast(allDays.length > 0 && allDays[0].id === matchDayId);
      setLoading(false);
    });
  }, [matchDayId, matchDayRepo, championshipId, navigate]);

  async function handleDelete() {
    await matchDayRepo.deleteLast(championshipId);
    navigate(`/championships/${championshipId}`, { replace: true });
  }

  if (loading || !matchDay) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {t("matchDay.resultTitle", { number: matchDay.matchDayNumber })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(matchDay.playedAt)}
          </p>
        </div>
        {isLast && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                {t("matchDay.deleteConfirm")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Team table */}
      <div className="space-y-1.5">
        {matchDay.teams.map((team) => (
          <div
            key={team.teamNumber}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <span className="text-xs font-bold text-muted-foreground w-6 text-center">
              {team.teamNumber}
            </span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <RoleIcon role="defender" className="shrink-0" />
              <span className="truncate">{team.defender.displayName}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <RoleIcon role="attacker" className="shrink-0" />
              <span className="truncate">{team.attacker.displayName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("matchDay.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("matchDay.deleteMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("championship.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("matchDay.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
