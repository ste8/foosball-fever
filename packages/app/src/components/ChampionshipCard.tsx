import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFormatDate } from "@/hooks/useFormatDate";
import type { ChampionshipWithStats } from "@/repositories";

export function ChampionshipCard({
  championship,
}: {
  championship: ChampionshipWithStats;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formatDate = useFormatDate();

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => navigate(`/championships/${championship.id}`)}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-base">{championship.name}</CardTitle>
        <CardDescription>
          {t("championship.stats", {
            players: championship.playerCount,
            matchDays: championship.matchDayCount,
          })}
          {championship.lastPlayedAt && (
            <>
              {" · "}
              {t("championship.lastPlayed", {
                date: formatDate(championship.lastPlayedAt),
              })}
            </>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
