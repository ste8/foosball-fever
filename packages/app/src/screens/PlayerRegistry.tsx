import { useTranslation } from "react-i18next";

export function PlayerRegistry() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("screen.playerRegistry")}</h1>
    </div>
  );
}
