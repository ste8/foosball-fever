import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

export function MatchDayResult() {
  const { t } = useTranslation();
  const { id, matchDayId } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("screen.matchDayResult")}</h1>
      <p className="mt-2 text-muted-foreground">
        Championship: {id} / Match Day: {matchDayId}
      </p>
    </div>
  );
}
