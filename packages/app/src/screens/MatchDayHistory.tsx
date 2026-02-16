import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRepositories } from "@/repositories/RepositoryContext";
import { useFormatDate } from "@/hooks/useFormatDate";
import type { Championship, MatchDay } from "@/types";

export function MatchDayHistory() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formatDate = useFormatDate();
  const { championships, matchDays: matchDayRepo } = useRepositories();

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [matchDays, setMatchDays] = useState<MatchDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      championships.getById(id),
      matchDayRepo.getByChampionshipId(id),
    ]).then(([champ, days]) => {
      setChampionship(champ);
      setMatchDays(days);
      setLoading(false);
    });
  }, [id, championships, matchDayRepo]);

  if (loading || !championship) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t("matchDay.historyTitle")}</h1>
        <p className="text-sm text-muted-foreground">{championship.name}</p>
      </div>

      {matchDays.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("matchDay.historyEmpty")}
        </p>
      ) : (
        <div className="space-y-2">
          {matchDays.map((md) => (
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
                {t("matchDay.historyTeams", { count: md.teamCount ?? 0 })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
