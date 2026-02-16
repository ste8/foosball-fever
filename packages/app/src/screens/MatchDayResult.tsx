import { useTranslation } from "react-i18next";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleIcon } from "@/components/RoleIcon";
import type { GenerationResult } from "@foosball-fever/team-generator";
import type { RosterEntryWithPlayer } from "@/types";

interface PreviewState {
  result: GenerationResult;
  rosterEntries: RosterEntryWithPlayer[];
}

export function MatchDayResult() {
  const { t } = useTranslation();
  const { id, matchDayId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const previewState = location.state as PreviewState | null;

  // Preview mode: coming from generation
  if (previewState?.result) {
    const { result, rosterEntries } = previewState;

    // Build player lookup from roster entries
    const playerMap = new Map<string, string>();
    for (const entry of rosterEntries) {
      playerMap.set(entry.playerId, entry.player.displayName);
    }

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t("matchDay.previewTitle")}</h1>

        {/* Metrics */}
        <div className="flex gap-4 text-sm text-muted-foreground">
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

        {/* Teams */}
        <div className="space-y-2">
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
                  {playerMap.get(team.defenderId) ?? team.defenderId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <RoleIcon role="attacker" className="shrink-0" />
                <span className="truncate">
                  {playerMap.get(team.attackerId) ?? team.attackerId}
                </span>
              </div>
              {team.lastOccurrence !== undefined && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {team.lastOccurrence}d ago
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("matchDay.regenerate")}
          </Button>
          <Button className="flex-1" disabled>
            <Check className="h-4 w-4" />
            {t("matchDay.accept")}
          </Button>
        </div>
      </div>
    );
  }

  // Saved match day view — placeholder for Phase 7
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("screen.matchDayResult")}</h1>
      <p className="mt-2 text-muted-foreground">
        Championship: {id} / Match Day: {matchDayId}
      </p>
    </div>
  );
}
