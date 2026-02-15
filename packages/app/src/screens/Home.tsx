import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChampionshipCard } from "@/components/ChampionshipCard";
import { CreateChampionshipDialog } from "@/components/CreateChampionshipDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useRepositories } from "@/repositories/RepositoryContext";
import type { ChampionshipWithStats } from "@/repositories";

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { championships } = useRepositories();
  const [active, setActive] = useState<ChampionshipWithStats[]>([]);
  const [archived, setArchived] = useState<ChampionshipWithStats[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    championships.getAllWithStats(true).then((all) => {
      setActive(all.filter((c) => !c.archivedAt));
      setArchived(all.filter((c) => c.archivedAt));
    });
  }, [championships]);

  async function handleCreate(name: string) {
    const created = await championships.create({ name });
    navigate(`/championships/${created.id}`);
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("home.yourChampionships")}
      </h2>

      {active.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-muted-foreground">{t("home.emptyState")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("home.emptyStateAction")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((c) => (
            <ChampionshipCard key={c.id} championship={c} />
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setCreateOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t("home.newChampionship")}
      </Button>

      {archived.length > 0 && (
        <>
          <hr className="border-border" />
          <CollapsibleSection
            title={`${t("home.archived")} (${archived.length})`}
          >
            <div className="space-y-3">
              {archived.map((c) => (
                <ChampionshipCard key={c.id} championship={c} />
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}

      <hr className="border-border" />

      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => navigate("/players")}
      >
        <Users className="h-4 w-4" />
        {t("home.playersRegistry")}
      </Button>

      <CreateChampionshipDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
