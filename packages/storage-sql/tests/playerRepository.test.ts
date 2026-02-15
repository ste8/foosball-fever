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
});
