import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase, type TestContext } from "./helpers.ts";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestDatabase();
});

describe("playerRepository", () => {
  it("creates a player and reads it back", async () => {
    const player = await ctx.repos.players.create({
      firstName: "Marco",
      lastName: "Rossi",
      displayName: "Marco",
      preferredRole: "attacker",
    });

    expect(player.id).toBeTruthy();
    expect(player.firstName).toBe("Marco");
    expect(player.lastName).toBe("Rossi");
    expect(player.displayName).toBe("Marco");
    expect(player.preferredRole).toBe("attacker");
    expect(player.createdAt).toBeTruthy();
    expect(player.updatedAt).toBeTruthy();

    const fetched = await ctx.repos.players.getById(player.id);
    expect(fetched).toEqual(player);
  });

  it("creates a player without preferred role", async () => {
    const player = await ctx.repos.players.create({
      firstName: "Anna",
      lastName: "Bianchi",
      displayName: "Anna",
    });

    expect(player.preferredRole).toBeUndefined();
  });

  it("lists all players sorted by display name", async () => {
    await ctx.repos.players.create({
      firstName: "Chiara",
      lastName: "Conti",
      displayName: "Chiara",
    });
    await ctx.repos.players.create({
      firstName: "Anna",
      lastName: "Bianchi",
      displayName: "Anna",
    });
    await ctx.repos.players.create({
      firstName: "Marco",
      lastName: "Rossi",
      displayName: "Marco",
    });

    const all = await ctx.repos.players.getAll();
    expect(all).toHaveLength(3);
    expect(all.map((p) => p.displayName)).toEqual([
      "Anna",
      "Chiara",
      "Marco",
    ]);
  });

  it("updates a player", async () => {
    const player = await ctx.repos.players.create({
      firstName: "Marco",
      lastName: "Rossi",
      displayName: "Marco",
      preferredRole: "attacker",
    });

    const updated = await ctx.repos.players.update(player.id, {
      displayName: "Marco R.",
      preferredRole: "defender",
    });

    expect(updated.displayName).toBe("Marco R.");
    expect(updated.preferredRole).toBe("defender");
    expect(updated.firstName).toBe("Marco"); // unchanged
    expect(updated.updatedAt).toBeTruthy();
  });

  it("clears preferred role by passing null", async () => {
    const player = await ctx.repos.players.create({
      firstName: "Marco",
      lastName: "Rossi",
      displayName: "Marco",
      preferredRole: "attacker",
    });

    const updated = await ctx.repos.players.update(player.id, {
      preferredRole: null,
    });

    expect(updated.preferredRole).toBeUndefined();
  });

  it("deletes a player", async () => {
    const player = await ctx.repos.players.create({
      firstName: "Marco",
      lastName: "Rossi",
      displayName: "Marco",
    });

    await ctx.repos.players.delete(player.id);

    const fetched = await ctx.repos.players.getById(player.id);
    expect(fetched).toBeNull();
  });

  it("returns null for nonexistent player", async () => {
    const fetched = await ctx.repos.players.getById("nonexistent");
    expect(fetched).toBeNull();
  });

  it("throws when updating nonexistent player", async () => {
    await expect(
      ctx.repos.players.update("nonexistent", { displayName: "test" }),
    ).rejects.toThrow("Player not found");
  });

  describe("getAllWithChampionships", () => {
    it("returns players with empty championships when none assigned", async () => {
      await ctx.repos.players.create({
        firstName: "Marco",
        lastName: "Rossi",
        displayName: "Marco",
      });

      const players = await ctx.repos.players.getAllWithChampionships();
      expect(players).toHaveLength(1);
      expect(players[0].displayName).toBe("Marco");
      expect(players[0].championships).toEqual([]);
    });

    it("returns players with their championship memberships", async () => {
      const player = await ctx.repos.players.create({
        firstName: "Marco",
        lastName: "Rossi",
        displayName: "Marco",
      });
      const champ1 = await ctx.repos.championships.create({
        name: "Monday 2025/26",
      });
      const champ2 = await ctx.repos.championships.create({
        name: "Monday 24/25",
      });
      await ctx.repos.roster.addPlayer(champ1.id, player.id);
      await ctx.repos.roster.addPlayer(champ2.id, player.id);

      const players = await ctx.repos.players.getAllWithChampionships();
      expect(players).toHaveLength(1);
      expect(players[0].championships).toHaveLength(2);
      expect(players[0].championships.map((c) => c.name)).toContain(
        "Monday 2025/26",
      );
      expect(players[0].championships.map((c) => c.name)).toContain(
        "Monday 24/25",
      );
    });

    it("excludes deleted championships from membership list", async () => {
      const player = await ctx.repos.players.create({
        firstName: "Anna",
        lastName: "B",
        displayName: "Anna",
      });
      const champ = await ctx.repos.championships.create({ name: "Deleted" });
      await ctx.repos.roster.addPlayer(champ.id, player.id);
      await ctx.repos.championships.delete(champ.id);

      const players = await ctx.repos.players.getAllWithChampionships();
      expect(players[0].championships).toHaveLength(0);
    });
  });

  describe("getNotInChampionship", () => {
    it("returns players not already in the championship roster", async () => {
      const p1 = await ctx.repos.players.create({
        firstName: "Marco",
        lastName: "R",
        displayName: "Marco",
      });
      const p2 = await ctx.repos.players.create({
        firstName: "Anna",
        lastName: "B",
        displayName: "Anna",
      });
      const champ = await ctx.repos.championships.create({ name: "Test" });
      await ctx.repos.roster.addPlayer(champ.id, p1.id);

      const available = await ctx.repos.players.getNotInChampionship(champ.id);
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe(p2.id);
    });

    it("returns all players when championship has no roster", async () => {
      await ctx.repos.players.create({
        firstName: "A",
        lastName: "A",
        displayName: "A",
      });
      await ctx.repos.players.create({
        firstName: "B",
        lastName: "B",
        displayName: "B",
      });
      const champ = await ctx.repos.championships.create({ name: "Empty" });

      const available = await ctx.repos.players.getNotInChampionship(champ.id);
      expect(available).toHaveLength(2);
    });
  });

  describe("isInAnyActiveRoster", () => {
    it("returns false for player not in any roster", async () => {
      const player = await ctx.repos.players.create({
        firstName: "Marco",
        lastName: "R",
        displayName: "Marco",
      });

      const result = await ctx.repos.players.isInAnyActiveRoster(player.id);
      expect(result).toBe(false);
    });

    it("returns true for player in an active championship", async () => {
      const player = await ctx.repos.players.create({
        firstName: "Marco",
        lastName: "R",
        displayName: "Marco",
      });
      const champ = await ctx.repos.championships.create({ name: "Active" });
      await ctx.repos.roster.addPlayer(champ.id, player.id);

      const result = await ctx.repos.players.isInAnyActiveRoster(player.id);
      expect(result).toBe(true);
    });

    it("returns false if only in archived championship", async () => {
      const player = await ctx.repos.players.create({
        firstName: "Marco",
        lastName: "R",
        displayName: "Marco",
      });
      const champ = await ctx.repos.championships.create({ name: "Archived" });
      await ctx.repos.roster.addPlayer(champ.id, player.id);
      await ctx.repos.championships.archive(champ.id);

      const result = await ctx.repos.players.isInAnyActiveRoster(player.id);
      expect(result).toBe(false);
    });

    it("returns false if only in deleted championship", async () => {
      const player = await ctx.repos.players.create({
        firstName: "Marco",
        lastName: "R",
        displayName: "Marco",
      });
      const champ = await ctx.repos.championships.create({ name: "Deleted" });
      await ctx.repos.roster.addPlayer(champ.id, player.id);
      await ctx.repos.championships.delete(champ.id);

      const result = await ctx.repos.players.isInAnyActiveRoster(player.id);
      expect(result).toBe(false);
    });
  });
});
