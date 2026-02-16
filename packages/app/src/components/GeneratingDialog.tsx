import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function GeneratingDialog({
  open,
  onStop,
}: {
  open: boolean;
  onStop: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("matchDay.generating")}</DialogTitle>
          <DialogDescription>{t("matchDay.generatingStatus")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <Button variant="outline" onClick={onStop}>
            {t("matchDay.stopGeneration")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
