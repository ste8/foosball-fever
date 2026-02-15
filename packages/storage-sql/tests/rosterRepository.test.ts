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

describe("rosterRepository", () => {
  it("adds a player to a championship roster", async () => {
    const player = await createPlayer("Marco");
    const champ = await createChampionship("Test");

    const entry = await ctx.repos.roster.addPlayer(
      champ.id,
      player.id,
      "attacker",
    );

    expect(entry.id).toBeTruthy();
    expect(entry.championshipId).toBe(champ.id);
    expect(entry.playerId).toBe(player.id);
    expect(entry.preferredRole).toBe("attacker");
  });

  it("gets roster entries with player data joined", async () => {
    const marco = await createPlayer("Marco");
    const anna = await createPlayer("Anna");
    const champ = await createChampionship("Test");

    await ctx.repos.roster.addPlayer(champ.id, marco.id, "attacker");
    await ctx.repos.roster.addPlayer(champ.id, anna.id, "defender");

    const entries = await ctx.repos.roster.getByChampionshipId(champ.id);
    expect(entries).toHaveLength(2);
    // Sorted by display_name
    expect(entries[0].player.displayName).toBe("Anna");
    expect(entries[1].player.displayName).toBe("Marco");
    expect(entries[0].preferredRole).toBe("defender");
    expect(entries[1].preferredRole).toBe("attacker");
  });

  it("updates preferred role for a roster entry", async () => {
    const player = await createPlayer("Marco");
    const champ = await createChampionship("Test");
    const entry = await ctx.repos.roster.addPlayer(
      champ.id,
      player.id,
      "attacker",
    );

    await ctx.repos.roster.updatePreferredRole(entry.id, "defender");

    const entries = await ctx.repos.roster.getByChampionshipId(champ.id);
    expect(entries[0].preferredRole).toBe("defender");
  });

  it("clears preferred role", async () => {
    const player = await createPlayer("Marco");
    const champ = await createChampionship("Test");
    const entry = await ctx.repos.roster.addPlayer(
      champ.id,
      player.id,
      "attacker",
    );

    await ctx.repos.roster.updatePreferredRole(entry.id);

    const entries = await ctx.repos.roster.getByChampionshipId(champ.id);
    expect(entries[0].preferredRole).toBeUndefined();
  });

  it("removes a player from the roster", async () => {
    const player = await createPlayer("Marco");
    const champ = await createChampionship("Test");
    const entry = await ctx.repos.roster.addPlayer(champ.id, player.id);

    await ctx.repos.roster.removePlayer(entry.id);

    const entries = await ctx.repos.roster.getByChampionshipId(champ.id);
    expect(entries).toHaveLength(0);
  });

  it("enforces uniqueness: same player cannot be added twice", async () => {
    const player = await createPlayer("Marco");
    const champ = await createChampionship("Test");

    await ctx.repos.roster.addPlayer(champ.id, player.id);

    await expect(
      ctx.repos.roster.addPlayer(champ.id, player.id),
    ).rejects.toThrow();
  });

  it("enforces foreign key: cannot add nonexistent player", async () => {
    const champ = await createChampionship("Test");

    await expect(
      ctx.repos.roster.addPlayer(champ.id, "nonexistent"),
    ).rejects.toThrow();
  });

  it("enforces foreign key: cannot add to nonexistent championship", async () => {
    const player = await createPlayer("Marco");

    await expect(
      ctx.repos.roster.addPlayer("nonexistent", player.id),
    ).rejects.toThrow();
  });

  it("returns empty array for championship with no roster", async () => {
    const champ = await createChampionship("Test");
    const entries = await ctx.repos.roster.getByChampionshipId(champ.id);
    expect(entries).toHaveLength(0);
  });
});
