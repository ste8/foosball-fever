import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Wand2, AlertTriangle } from "lucide-react";
import { generateTeams } from "@foosball-fever/team-generator";
import type { MatchDayHistory } from "@foosball-fever/team-generator";
import { Button } from "@/components/ui/button";
import { PlayerRoleRow } from "@/components/PlayerRoleRow";
import { GeneratingDialog } from "@/components/GeneratingDialog";
import { AddPlayerDialog } from "@/components/AddPlayerDialog";
import { PlayerFormDialog } from "@/components/PlayerFormDialog";
import { RoleIcon } from "@/components/RoleIcon";
import { useRepositories } from "@/repositories/RepositoryContext";
import type { Championship, Player, RosterEntryWithPlayer, Role } from "@/types";

type RoleState = Role | undefined; // undefined = sitting out

function getEffectivePreference(entry: RosterEntryWithPlayer): Role | undefined {
  return entry.preferredRole ?? entry.player.preferredRole;
}

export function MatchDaySetup() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { championships, roster, matchDays: matchDayRepo, players } =
    useRepositories();

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [rosterEntries, setRosterEntries] = useState<RosterEntryWithPlayer[]>(
    [],
  );
  const [roles, setRoles] = useState<Map<string, RoleState>>(new Map());
  const [history, setHistory] = useState<MatchDayHistory[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [filter, setFilter] = useState<"all" | "defender" | "attacker" | "out">(
    "all",
  );
  const [generating, setGenerating] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch-primary devices get tap-to-cycle; pointer devices get click-to-focus
  const isTouchPrimary = window.matchMedia("(pointer: coarse)").matches;

  // Load data
  function reload() {
    if (!id) return;
    Promise.all([
      championships.getById(id),
      roster.getByChampionshipId(id),
      matchDayRepo.getHistory(id),
      players.getNotInChampionship(id),
    ]).then(([champ, entries, hist, available]) => {
      setChampionship(champ);
      setRosterEntries(entries);
      setHistory(hist);
      setAvailablePlayers(available);

      // Initialize roles for new players (preserve existing assignments)
      setRoles((prev) => {
        const next = new Map(prev);
        for (const entry of entries) {
          if (!next.has(entry.playerId)) {
            next.set(entry.playerId, undefined); // sitting out
          }
        }
        return next;
      });
    });
  }

  useEffect(() => {
    reload();
  }, [id, championships, roster, matchDayRepo, players]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Role transitions
  function cycleRole(playerId: string) {
    setRoles((prev) => {
      const next = new Map(prev);
      const current = next.get(playerId);
      if (current === undefined) next.set(playerId, "attacker");
      else if (current === "attacker") next.set(playerId, "defender");
      else next.set(playerId, undefined);
      return next;
    });
  }

  function moveTowardDefender(playerId: string) {
    setRoles((prev) => {
      const next = new Map(prev);
      const current = next.get(playerId);
      if (current === "attacker") next.set(playerId, undefined);
      else if (current === undefined) next.set(playerId, "defender");
      // defender → no-op
      return next;
    });
  }

  function moveTowardAttacker(playerId: string) {
    setRoles((prev) => {
      const next = new Map(prev);
      const current = next.get(playerId);
      if (current === "defender") next.set(playerId, undefined);
      else if (current === undefined) next.set(playerId, "attacker");
      // attacker → no-op
      return next;
    });
  }

  function resetToSittingOut(playerId: string) {
    setRoles((prev) => {
      const next = new Map(prev);
      next.set(playerId, undefined);
      return next;
    });
  }

  // Auto-assign: set role from preference for sitting-out players
  function autoAssign() {
    setRoles((prev) => {
      const next = new Map(prev);
      for (const entry of rosterEntries) {
        if (next.get(entry.playerId) !== undefined) continue; // already assigned
        const pref = getEffectivePreference(entry);
        if (pref) next.set(entry.playerId, pref);
      }
      return next;
    });
  }

  // Derived state
  const defenders = rosterEntries.filter(
    (e) => roles.get(e.playerId) === "defender",
  );
  const attackers = rosterEntries.filter(
    (e) => roles.get(e.playerId) === "attacker",
  );
  const sittingOut = rosterEntries.filter(
    (e) => roles.get(e.playerId) === undefined,
  );
  const isBalanced =
    defenders.length === attackers.length && defenders.length > 0;

  // Filtered list for mobile
  const filteredEntries =
    filter === "defender"
      ? defenders
      : filter === "attacker"
        ? attackers
        : filter === "out"
          ? sittingOut
          : rosterEntries;

  // Keyboard handler
  function handleKeyDown(e: React.KeyboardEvent) {
    const entries = rosterEntries;
    if (entries.length === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = Math.min(focusedIndex + 1, entries.length - 1);
        setFocusedIndex(next);
        scrollToIndex(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const next = Math.max(focusedIndex - 1, 0);
        setFocusedIndex(next);
        scrollToIndex(next);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        const entry = entries[focusedIndex];
        if (entry) moveTowardDefender(entry.playerId);
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        const entry = entries[focusedIndex];
        if (entry) moveTowardAttacker(entry.playerId);
        break;
      }
      case "Delete":
      case "Backspace": {
        e.preventDefault();
        const entry = entries[focusedIndex];
        if (entry) resetToSittingOut(entry.playerId);
        break;
      }
    }
  }

  function scrollToIndex(index: number) {
    const container = listRef.current;
    if (!container) return;
    const item = container.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }

  function focusOnPlayer(playerId: string) {
    const idx = rosterEntries.findIndex((e) => e.playerId === playerId);
    if (idx >= 0) {
      setFocusedIndex(idx);
      listRef.current?.focus();
      scrollToIndex(idx);
    }
  }

  // Add player flow
  async function handleAddPlayer(playerId: string) {
    if (!id) return;
    await roster.addPlayer(id, playerId);
    reload();
  }

  async function handleCreateAndAdd(data: {
    firstName: string;
    lastName: string;
    displayName: string;
    preferredRole?: Role;
  }) {
    if (!id) return;
    const player = await players.create(data);
    await roster.addPlayer(id, player.id);
    reload();
  }

  // Generation flow
  function handleGenerate() {
    const attackerIds = attackers.map((e) => e.playerId);
    const defenderIds = defenders.map((e) => e.playerId);
    const seed = Math.floor(Math.random() * 2147483647);
    const input = { attackerIds, defenderIds, history, seed };

    setGenerating(true);

    try {
      const worker = new Worker(
        new URL("../workers/generateTeams.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === "done") {
          cleanup();
          navigateToPreview(e.data.result);
        }
      };

      worker.onerror = () => {
        cleanup();
        // Fallback: run synchronously
        const result = generateTeams(input);
        navigateToPreview(result);
      };

      worker.postMessage(input);

      // Safety timeout: 5 seconds
      timeoutRef.current = setTimeout(() => {
        worker.terminate();
        workerRef.current = null;
        setGenerating(false);
        // Fallback: run synchronously
        const result = generateTeams(input);
        navigateToPreview(result);
      }, 5000);
    } catch {
      setGenerating(false);
      // Fallback: run synchronously
      const result = generateTeams(input);
      navigateToPreview(result);
    }
  }

  function handleStopGeneration() {
    workerRef.current?.terminate();
    cleanup();
    // Run sync fallback
    const attackerIds = attackers.map((e) => e.playerId);
    const defenderIds = defenders.map((e) => e.playerId);
    const seed = Math.floor(Math.random() * 2147483647);
    const result = generateTeams({ attackerIds, defenderIds, history, seed });
    navigateToPreview(result);
  }

  function cleanup() {
    workerRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setGenerating(false);
  }

  function navigateToPreview(result: unknown) {
    const attackerIds = attackers.map((e) => e.playerId);
    const defenderIds = defenders.map((e) => e.playerId);
    const playerMap: Record<string, string> = {};
    for (const entry of rosterEntries) {
      playerMap[entry.playerId] = entry.player.displayName;
    }
    navigate(`/championships/${id}/match-days/result`, {
      state: {
        result,
        championshipId: id,
        championshipName: championship!.name,
        matchDayNumber: history.length + 1,
        history,
        attackerIds,
        defenderIds,
        playerMap,
      },
    });
  }

  if (!championship) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (rosterEntries.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{championship.name}</p>
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-muted-foreground">
            {t("matchDay.noPlayersInRoster")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("matchDay.addPlayersFirst")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-col md:h-full p-6 gap-4">
        <p className="text-sm text-muted-foreground">{championship.name}</p>

        <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 flex-1 min-h-0">
          {/* Left: Defenders */}
          <div className="flex flex-col min-h-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
              <RoleIcon role="defender" />
              {t("matchDay.defenders")} ({defenders.length})
            </h2>
            <div className="overflow-y-auto flex-1 space-y-0.5">
              {defenders.map((entry) => (
                <button
                  key={entry.playerId}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                  onClick={() => focusOnPlayer(entry.playerId)}
                >
                  <RoleIcon role="defender" className="shrink-0" />
                  <span className="truncate">{entry.player.displayName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center: All Players */}
          <div className="flex flex-col min-h-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("matchDay.allPlayers")} ({rosterEntries.length})
            </h2>
            <div
              ref={listRef}
              className="overflow-y-auto flex-1 space-y-0.5 focus:outline-none"
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >
              {rosterEntries.map((entry, i) => (
                <PlayerRoleRow
                  key={entry.playerId}
                  displayName={entry.player.displayName}
                  role={roles.get(entry.playerId)}
                  preferenceHint={getEffectivePreference(entry)}
                  isFocused={i === focusedIndex}
                  onClick={
                    isTouchPrimary
                      ? () => cycleRole(entry.playerId)
                      : () => focusOnPlayer(entry.playerId)
                  }
                  onSwipeLeft={() => moveTowardDefender(entry.playerId)}
                  onSwipeRight={() => moveTowardAttacker(entry.playerId)}
                />
              ))}
            </div>
          </div>

          {/* Right: Attackers */}
          <div className="flex flex-col min-h-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2 flex items-center gap-1">
              <RoleIcon role="attacker" />
              {t("matchDay.attackers")} ({attackers.length})
            </h2>
            <div className="overflow-y-auto flex-1 space-y-0.5">
              {attackers.map((entry) => (
                <button
                  key={entry.playerId}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                  onClick={() => focusOnPlayer(entry.playerId)}
                >
                  <RoleIcon role="attacker" className="shrink-0" />
                  <span className="truncate">{entry.player.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop bottom actions */}
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("matchDay.addPlayer")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={autoAssign}>
              <Wand2 className="h-4 w-4" />
              {t("matchDay.autoAssign")}
            </Button>
          </div>

          {!isBalanced && (attackers.length > 0 || defenders.length > 0) && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t("matchDay.needEqual")}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!isBalanced}
            onClick={handleGenerate}
          >
            {t("matchDay.generate")}
          </Button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-full">
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{championship.name}</p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={autoAssign}
            >
              <Wand2 className="h-4 w-4" />
              {t("matchDay.autoAssign")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("matchDay.addPlayer")}
            </Button>
          </div>
        </div>

        {/* Scrollable player list */}
        <div className="flex-1 overflow-y-auto px-4 space-y-0.5">
          {filteredEntries.map((entry) => (
            <PlayerRoleRow
              key={entry.playerId}
              displayName={entry.player.displayName}
              role={roles.get(entry.playerId)}
              preferenceHint={getEffectivePreference(entry)}
              onClick={() => cycleRole(entry.playerId)}
              onSwipeLeft={() => moveTowardDefender(entry.playerId)}
              onSwipeRight={() => moveTowardAttacker(entry.playerId)}
            />
          ))}
        </div>

        {/* Sticky bottom bar */}
        <div className="sticky bottom-0 border-t bg-background p-4 space-y-3">
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "defender"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              onClick={() =>
                setFilter((f) => (f === "defender" ? "all" : "defender"))
              }
            >
              <RoleIcon role="defender" className="h-3 w-3" />
              {defenders.length} {t("matchDay.defAbbrev")}
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "attacker"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              onClick={() =>
                setFilter((f) => (f === "attacker" ? "all" : "attacker"))
              }
            >
              <RoleIcon role="attacker" className="h-3 w-3" />
              {attackers.length} {t("matchDay.attAbbrev")}
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "out"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
              onClick={() =>
                setFilter((f) => (f === "out" ? "all" : "out"))
              }
            >
              {sittingOut.length} {t("matchDay.out")}
            </button>
          </div>

          {!isBalanced && (attackers.length > 0 || defenders.length > 0) && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t("matchDay.needEqual")}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!isBalanced}
            onClick={handleGenerate}
          >
            {t("matchDay.generate")}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <AddPlayerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        availablePlayers={availablePlayers}
        onAddPlayer={handleAddPlayer}
        onCreatePlayer={() => setCreatePlayerOpen(true)}
      />

      <PlayerFormDialog
        open={createPlayerOpen}
        onOpenChange={setCreatePlayerOpen}
        onSave={handleCreateAndAdd}
      />

      <GeneratingDialog open={generating} onStop={handleStopGeneration} />
    </div>
  );
}
