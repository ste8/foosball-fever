import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase, type TestContext } from "./helpers.ts";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestDatabase();
});

async function createPlayer(name: string) {
  return ctx.repos.players.create({
    firstName: name,
    lastName: "Test",
    displayName: name,
  });
}

async function createChampionship(name: string) {
  return ctx.repos.championships.create({ name });
}

describe("matchDayRepository", () => {
  it("creates a match day with teams (transactional)", async () => {
    const champ = await createChampionship("Test");
    const marco = await createPlayer("Marco");
    const anna = await createPlayer("Anna");
    const luca = await createPlayer("Luca");
    const giulia = await createPlayer("Giulia");

    const matchDay = await ctx.repos.matchDays.create(
      champ.id,
      1,
      "2025-10-27",
      [
        { attackerId: marco.id, defenderId: anna.id, teamNumber: 1 },
        { attackerId: luca.id, defenderId: giulia.id, teamNumber: 2 },
      ],
    );

    expect(matchDay.id).toBeTruthy();
    expect(matchDay.championshipId).toBe(champ.id);
    expect(matchDay.matchDayNumber).toBe(1);
    expect(matchDay.playedAt).toBe("2025-10-27");
  });

  it("reads a match day with teams and player data", async () => {
    const champ = await createChampionship("Test");
    const marco = await createPlayer("Marco");
    const anna = await createPlayer("Anna");

    const matchDay = await ctx.repos.matchDays.create(
      champ.id,
      1,
      "2025-10-27",
      [{ attackerId: marco.id, defenderId: anna.id, teamNumber: 1 }],
    );

    const fetched = await ctx.repos.matchDays.getById(matchDay.id);
    expect(fetched).toBeTruthy();
    expect(fetched!.teams).toHaveLength(1);
    expect(fetched!.teams[0].attacker.displayName).toBe("Marco");
    expect(fetched!.teams[0].defender.displayName).toBe("Anna");
    expect(fetched!.teams[0].teamNumber).toBe(1);
  });

  it("lists match days ordered by match day number descending", async () => {
    const champ = await createChampionship("Test");
    const p1 = await createPlayer("A");
    const p2 = await createPlayer("B");

    await ctx.repos.matchDays.create(champ.id, 1, "2025-10-20", [
      { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
    ]);
    await ctx.repos.matchDays.create(champ.id, 2, "2025-10-27", [
      { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
    ]);

    const list = await ctx.repos.matchDays.getByChampionshipId(champ.id);
    expect(list).toHaveLength(2);
    expect(list[0].matchDayNumber).toBe(2);
    expect(list[1].matchDayNumber).toBe(1);
  });

  it("deletes the last match day and its teams", async () => {
    const champ = await createChampionship("Test");
    const p1 = await createPlayer("A");
    const p2 = await createPlayer("B");

    await ctx.repos.matchDays.create(champ.id, 1, "2025-10-20", [
      { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
    ]);
    const md2 = await ctx.repos.matchDays.create(champ.id, 2, "2025-10-27", [
      { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
    ]);

    await ctx.repos.matchDays.deleteLast(champ.id);

    const fetched = await ctx.repos.matchDays.getById(md2.id);
    expect(fetched).toBeNull();

    const remaining = await ctx.repos.matchDays.getByChampionshipId(champ.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].matchDayNumber).toBe(1);
  });

  it("throws when deleting from championship with no match days", async () => {
    const champ = await createChampionship("Test");
    await expect(
      ctx.repos.matchDays.deleteLast(champ.id),
    ).rejects.toThrow("No match days to delete");
  });

  it("transaction rolls back if team insert fails", async () => {
    const champ = await createChampionship("Test");
    const p1 = await createPlayer("A");

    // attacker and defender are the same player — violates CHECK constraint
    await expect(
      ctx.repos.matchDays.create(champ.id, 1, "2025-10-27", [
        { attackerId: p1.id, defenderId: p1.id, teamNumber: 1 },
      ]),
    ).rejects.toThrow();

    // Match day should not exist (rolled back)
    const list = await ctx.repos.matchDays.getByChampionshipId(champ.id);
    expect(list).toHaveLength(0);
  });

  it("enforces unique match day number per championship", async () => {
    const champ = await createChampionship("Test");
    const p1 = await createPlayer("A");
    const p2 = await createPlayer("B");

    await ctx.repos.matchDays.create(champ.id, 1, "2025-10-20", [
      { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
    ]);

    await expect(
      ctx.repos.matchDays.create(champ.id, 1, "2025-10-27", [
        { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
      ]),
    ).rejects.toThrow();
  });

  it("returns null for nonexistent match day", async () => {
    const fetched = await ctx.repos.matchDays.getById("nonexistent");
    expect(fetched).toBeNull();
  });

  describe("getHistory", () => {
    it("returns history in algorithm-compatible format (oldest→newest)", async () => {
      const champ = await createChampionship("Test");
      const marco = await createPlayer("Marco");
      const anna = await createPlayer("Anna");
      const luca = await createPlayer("Luca");
      const giulia = await createPlayer("Giulia");

      // Create match days in order
      await ctx.repos.matchDays.create(champ.id, 1, "2025-10-13", [
        { attackerId: marco.id, defenderId: anna.id, teamNumber: 1 },
        { attackerId: luca.id, defenderId: giulia.id, teamNumber: 2 },
      ]);
      await ctx.repos.matchDays.create(champ.id, 2, "2025-10-20", [
        { attackerId: luca.id, defenderId: anna.id, teamNumber: 1 },
        { attackerId: marco.id, defenderId: giulia.id, teamNumber: 2 },
      ]);

      const history = await ctx.repos.matchDays.getHistory(champ.id);

      expect(history).toHaveLength(2);
      // Ordered oldest→newest
      expect(history[0].matchDayNumber).toBe(1);
      expect(history[1].matchDayNumber).toBe(2);

      // Match day 1 teams
      expect(history[0].teams).toHaveLength(2);
      expect(history[0].teams[0].attackerId).toBe(marco.id);
      expect(history[0].teams[0].defenderId).toBe(anna.id);

      // Match day 2 teams
      expect(history[1].teams).toHaveLength(2);
      expect(history[1].teams[0].attackerId).toBe(luca.id);
      expect(history[1].teams[0].defenderId).toBe(anna.id);
    });

    it("returns empty array for championship with no match days", async () => {
      const champ = await createChampionship("Test");
      const history = await ctx.repos.matchDays.getHistory(champ.id);
      expect(history).toHaveLength(0);
    });
  });
});
