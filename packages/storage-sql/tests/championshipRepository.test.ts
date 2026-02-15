import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase, type TestContext } from "./helpers.ts";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestDatabase();
});

describe("championshipRepository", () => {
  it("creates a championship and reads it back", async () => {
    const champ = await ctx.repos.championships.create({
      name: "Monday Foosball 2025/26",
    });

    expect(champ.id).toBeTruthy();
    expect(champ.name).toBe("Monday Foosball 2025/26");
    expect(champ.archivedAt).toBeUndefined();
    expect(champ.deletedAt).toBeUndefined();

    const fetched = await ctx.repos.championships.getById(champ.id);
    expect(fetched).toEqual(champ);
  });

  it("lists active championships, excluding archived by default", async () => {
    const active = await ctx.repos.championships.create({
      name: "Active",
    });
    const archived = await ctx.repos.championships.create({
      name: "Archived",
    });
    await ctx.repos.championships.archive(archived.id);

    const all = await ctx.repos.championships.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(active.id);
  });

  it("lists all championships including archived when requested", async () => {
    await ctx.repos.championships.create({ name: "Active" });
    const archived = await ctx.repos.championships.create({
      name: "Archived",
    });
    await ctx.repos.championships.archive(archived.id);

    const all = await ctx.repos.championships.getAll(true);
    expect(all).toHaveLength(2);
  });

  it("excludes soft-deleted championships from listing", async () => {
    const champ = await ctx.repos.championships.create({
      name: "Deleted",
    });
    await ctx.repos.championships.delete(champ.id);

    const all = await ctx.repos.championships.getAll(true);
    expect(all).toHaveLength(0);
  });

  it("updates a championship name", async () => {
    const champ = await ctx.repos.championships.create({
      name: "Old Name",
    });
    const updated = await ctx.repos.championships.update(champ.id, {
      name: "New Name",
    });

    expect(updated.name).toBe("New Name");
    expect(updated.updatedAt).toBeTruthy();
  });

  it("archives and unarchives a championship", async () => {
    const champ = await ctx.repos.championships.create({
      name: "Test",
    });

    await ctx.repos.championships.archive(champ.id);
    let fetched = await ctx.repos.championships.getById(champ.id);
    expect(fetched?.archivedAt).toBeTruthy();

    await ctx.repos.championships.unarchive(champ.id);
    fetched = await ctx.repos.championships.getById(champ.id);
    expect(fetched?.archivedAt).toBeUndefined();
  });

  it("soft deletes a championship", async () => {
    const champ = await ctx.repos.championships.create({
      name: "Test",
    });

    await ctx.repos.championships.delete(champ.id);
    const fetched = await ctx.repos.championships.getById(champ.id);
    expect(fetched?.deletedAt).toBeTruthy();
  });

  it("returns null for nonexistent championship", async () => {
    const fetched = await ctx.repos.championships.getById("nonexistent");
    expect(fetched).toBeNull();
  });

  it("throws when updating nonexistent championship", async () => {
    await expect(
      ctx.repos.championships.update("nonexistent", { name: "test" }),
    ).rejects.toThrow("Championship not found");
  });

  describe("getAllWithStats", () => {
    it("returns empty stats for championship with no roster or match days", async () => {
      const champ = await ctx.repos.championships.create({ name: "Empty" });
      const all = await ctx.repos.championships.getAllWithStats();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(champ.id);
      expect(all[0].matchDayCount).toBe(0);
      expect(all[0].playerCount).toBe(0);
      expect(all[0].lastPlayedAt).toBeUndefined();
    });

    it("returns correct stats after adding roster and match days", async () => {
      const champ = await ctx.repos.championships.create({ name: "Active" });
      const p1 = await ctx.repos.players.create({
        firstName: "A",
        lastName: "A",
        displayName: "A",
      });
      const p2 = await ctx.repos.players.create({
        firstName: "B",
        lastName: "B",
        displayName: "B",
      });
      const p3 = await ctx.repos.players.create({
        firstName: "C",
        lastName: "C",
        displayName: "C",
      });
      const p4 = await ctx.repos.players.create({
        firstName: "D",
        lastName: "D",
        displayName: "D",
      });
      await ctx.repos.roster.addPlayer(champ.id, p1.id);
      await ctx.repos.roster.addPlayer(champ.id, p2.id);
      await ctx.repos.roster.addPlayer(champ.id, p3.id);
      await ctx.repos.roster.addPlayer(champ.id, p4.id);
      await ctx.repos.matchDays.create(champ.id, 1, "2025-01-10T20:00:00Z", [
        { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
        { attackerId: p3.id, defenderId: p4.id, teamNumber: 2 },
      ]);
      await ctx.repos.matchDays.create(champ.id, 2, "2025-01-17T20:00:00Z", [
        { attackerId: p1.id, defenderId: p3.id, teamNumber: 1 },
        { attackerId: p2.id, defenderId: p4.id, teamNumber: 2 },
      ]);

      const all = await ctx.repos.championships.getAllWithStats();
      expect(all).toHaveLength(1);
      expect(all[0].matchDayCount).toBe(2);
      expect(all[0].playerCount).toBe(4);
      expect(all[0].lastPlayedAt).toBe("2025-01-17T20:00:00Z");
    });

    it("excludes archived by default", async () => {
      await ctx.repos.championships.create({ name: "Active" });
      const archived = await ctx.repos.championships.create({
        name: "Archived",
      });
      await ctx.repos.championships.archive(archived.id);

      const stats = await ctx.repos.championships.getAllWithStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].name).toBe("Active");
    });

    it("includes archived when requested", async () => {
      await ctx.repos.championships.create({ name: "Active" });
      const archived = await ctx.repos.championships.create({
        name: "Archived",
      });
      await ctx.repos.championships.archive(archived.id);

      const stats = await ctx.repos.championships.getAllWithStats(true);
      expect(stats).toHaveLength(2);
    });

    it("excludes soft-deleted championships", async () => {
      const deleted = await ctx.repos.championships.create({
        name: "Deleted",
      });
      await ctx.repos.championships.delete(deleted.id);

      const stats = await ctx.repos.championships.getAllWithStats(true);
      expect(stats).toHaveLength(0);
    });
  });

  describe("getStatsById", () => {
    it("returns null for nonexistent id", async () => {
      const stats = await ctx.repos.championships.getStatsById("nonexistent");
      expect(stats).toBeNull();
    });

    it("returns correct stats for a single championship", async () => {
      const champ = await ctx.repos.championships.create({ name: "Test" });
      const p1 = await ctx.repos.players.create({
        firstName: "X",
        lastName: "X",
        displayName: "X",
      });
      const p2 = await ctx.repos.players.create({
        firstName: "Y",
        lastName: "Y",
        displayName: "Y",
      });
      await ctx.repos.roster.addPlayer(champ.id, p1.id);
      await ctx.repos.roster.addPlayer(champ.id, p2.id);
      await ctx.repos.matchDays.create(champ.id, 1, "2025-03-01T18:00:00Z", [
        { attackerId: p1.id, defenderId: p2.id, teamNumber: 1 },
      ]);

      const stats = await ctx.repos.championships.getStatsById(champ.id);
      expect(stats).toEqual({
        matchDayCount: 1,
        playerCount: 2,
        lastPlayedAt: "2025-03-01T18:00:00Z",
      });
    });
  });
});
