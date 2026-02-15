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
});
