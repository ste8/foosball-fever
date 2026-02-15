import { describe, it, expect } from 'vitest';
import { unorderedPairKey } from '../../src/generateTeams.js';

describe('unorderedPairKey', () => {
  it('normalizes order when first arg > second arg', () => {
    const key = unorderedPairKey('B', 'A');
    expect(key).toBe('A\0B');
  });

  it('preserves order when first arg < second arg', () => {
    const key = unorderedPairKey('A', 'B');
    expect(key).toBe('A\0B');
  });

  it('handles equal strings', () => {
    const key = unorderedPairKey('A', 'A');
    expect(key).toBe('A\0A');
  });

  it('returns same key for swapped inputs', () => {
    const key1 = unorderedPairKey('Alice', 'Bob');
    const key2 = unorderedPairKey('Bob', 'Alice');
    expect(key1).toBe(key2);
  });

  it('returns different keys for different pairs', () => {
    const key1 = unorderedPairKey('Alice', 'Bob');
    const key2 = unorderedPairKey('Alice', 'Charlie');
    expect(key1).not.toBe(key2);
  });

  it('works as Set key', () => {
    const set = new Set<string>();
    set.add(unorderedPairKey('X', 'Y'));
    expect(set.has(unorderedPairKey('Y', 'X'))).toBe(true);
    expect(set.size).toBe(1);
  });

  it('works as Map key', () => {
    const map = new Map<string, number>();
    map.set(unorderedPairKey('A', 'B'), 42);
    expect(map.get(unorderedPairKey('B', 'A'))).toBe(42);
  });

  it('uses ordinal comparison (case-sensitive)', () => {
    // 'A' (65) < 'a' (97) in ordinal
    const key = unorderedPairKey('a', 'A');
    expect(key).toBe('A\0a');
  });
});
