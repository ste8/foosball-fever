import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SettingsMenu } from "./SettingsMenu";

export function GlobalHeader({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <header className="border-b border-border px-4">
      <div className="flex h-14 items-center mx-auto w-full max-w-3xl">
        <div className="flex flex-1 items-center gap-2">
          {!isHome && (
            <button
              onClick={onBack ?? (() => navigate(-1))}
              className="inline-flex items-center gap-1 rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label={t("nav.back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <span className="text-lg font-semibold">{t("app.name")}</span>
        </div>
        <SettingsMenu />
      </div>
    </header>
  );
}
