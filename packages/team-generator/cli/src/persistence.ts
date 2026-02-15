import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import type { TournamentData } from './types.js';

export function loadData(path: string): TournamentData {
  if (!existsSync(path)) {
    return { players: [], rounds: [] };
  }
  try {
    const json = readFileSync(path, 'utf-8');
    return JSON.parse(json) as TournamentData;
  } catch {
    return { players: [], rounds: [] };
  }
}

export function saveData(path: string, data: TournamentData): void {
  const json = JSON.stringify(data, null, 2);
  const tmpPath = path + '.tmp';
  writeFileSync(tmpPath, json, 'utf-8');
  renameSync(tmpPath, path);
}
