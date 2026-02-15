import { useTranslation } from "react-i18next";
import { useTheme, type Theme } from "../theme/ThemeProvider";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const THEMES: { value: Theme; labelKey: string }[] = [
  { value: "classic", labelKey: "settings.themeClassic" },
  { value: "classic-dark", labelKey: "settings.themeClassicDark" },
  { value: "sensible-soccer", labelKey: "settings.themeSensibleSoccer" },
];

const LANGUAGES = [
  { value: "en", labelKey: "settings.langEnglish" },
  { value: "it", labelKey: "settings.langItalian" },
];

export function SettingsMenu() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label={t("nav.settings")}
        >
          <User className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("settings.theme")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v as Theme)}
        >
          {THEMES.map(({ value, labelKey }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={i18n.language.startsWith("it") ? "it" : "en"}
          onValueChange={(v) => i18n.changeLanguage(v)}
        >
          {LANGUAGES.map(({ value, labelKey }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
