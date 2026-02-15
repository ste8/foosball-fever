import { useTranslation } from "react-i18next";

export function useFormatDate() {
  const { i18n } = useTranslation();

  return (isoDate: string | undefined): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat(i18n.language, {
      month: "short",
      day: "numeric",
    }).format(date);
  };
}
