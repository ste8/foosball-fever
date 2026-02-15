import { useState } from 'react';
import { Box, Text } from 'ink';
import { MultiSelect, Select, StatusMessage, TextInput } from '@inkjs/ui';
import { Header } from '../components/Header.js';
import { PlayerGrid } from '../components/PlayerGrid.js';
import { TeamTable } from '../components/TeamTable.js';
import { generateTeams } from '../../../src/generateTeams.js';
import type { MatchDayHistory } from '../../../src/types.js';
import type { TournamentData, HistoricalRound } from '../types.js';

type Step =
  | 'quickInput'
  | 'selectAttackers'
  | 'selectDefenders'
  | 'results';

function toHistory(rounds: HistoricalRound[]): MatchDayHistory[] {
  return rounds.map((r, i) => ({
    matchDayNumber: i + 1,
    teams: r.teams.map((t) => ({
      attackerId: t.attacker,
      defenderId: t.defender,
    })),
  }));
}

/**
 * Parse a comma-separated token list into 0-based player indices.
 * Supports individual numbers ("3"), ranges ("1-4"), and wildcard ("*").
 * Numbers are 1-based in input, converted to 0-based internally.
 */
function parseTokens(
  input: string,
  playerCount: number,
): number[] | string {
  const tokens = input
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const indices = new Set<number>();

  for (const token of tokens) {
    if (token === '*') {
      for (let i = 0; i < playerCount; i++) indices.add(i);
      continue;
    }

    const rangeMatch = token.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start < 1 || end > playerCount || start > end) {
        return `Invalid range "${token}" (players are 1\u2013${playerCount}).`;
      }
      for (let i = start; i <= end; i++) indices.add(i - 1);
      continue;
    }

    const num = parseInt(token, 10);
    if (isNaN(num) || num < 1 || num > playerCount) {
      return `Invalid token "${token}" (players are 1\u2013${playerCount}).`;
    }
    indices.add(num - 1);
  }

  return [...indices].sort((a, b) => a - b);
}

/**
 * Parse quick input string. Supports:
 *   "defTokens|atkTokens"  — pipe-separated defender/attacker selection
 * Each side uses comma-separated numbers, ranges, or *.
 */
function parseQuickInput(
  input: string,
  players: string[],
): { attackers: string[]; defenders: string[] } | string {
  const pipeIdx = input.indexOf('|');
  if (pipeIdx === -1) {
    return 'Use format: defenders|attackers (e.g. "1,2,3|4,5,6").';
  }

  const defPart = input.slice(0, pipeIdx).trim();
  const atkPart = input.slice(pipeIdx + 1).trim();

  if (atkPart.length === 0 || defPart.length === 0) {
    return 'Both sides of | must have selections.';
  }

  const atkResult = parseTokens(atkPart, players.length);
  if (typeof atkResult === 'string') return `Attackers: ${atkResult}`;

  const defResult = parseTokens(defPart, players.length);
  if (typeof defResult === 'string') return `Defenders: ${defResult}`;

  if (atkResult.length === 0) return 'No attackers selected.';
  if (defResult.length === 0) return 'No defenders selected.';

  if (atkResult.length !== defResult.length) {
    return `Attacker count (${atkResult.length}) must equal defender count (${defResult.length}).`;
  }

  const overlap = atkResult.filter((i) => defResult.includes(i));
  if (overlap.length > 0) {
    const names = overlap.map((i) => players[i]).join(', ');
    return `Players cannot be both attacker and defender: ${names}.`;
  }

  return {
    attackers: atkResult.map((i) => players[i]),
    defenders: defResult.map((i) => players[i]),
  };
}

export function NewRound({
  data,
  onSave,
  onBack,
}: {
  data: TournamentData;
  onSave: (d: TournamentData) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<Step>('quickInput');
  const [attackers, setAttackers] = useState<string[]>([]);
  const [defenders, setDefenders] = useState<string[]>([]);
  const [result, setResult] = useState<ReturnType<typeof generateTeams> | null>(
    null,
  );
  const [seed, setSeed] = useState(() => Date.now());
  const [error, setError] = useState('');

  if (data.players.length < 2) {
    return (
      <Box flexDirection="column">
        <Header title="New Round" />
        <StatusMessage variant="error">
          Need at least 2 players. Go to Manage Players first.
        </StatusMessage>
        <Box marginTop={1}>
          <Select
            options={[{ label: '\u2190 Back', value: 'back' }]}
            onChange={() => onBack()}
          />
        </Box>
      </Box>
    );
  }

  const generate = (atk: string[], def: string[], s: number) => {
    const r = generateTeams({
      attackerIds: atk,
      defenderIds: def,
      history: toHistory(data.rounds),
      seed: s,
    });
    setResult(r);
    setStep('results');
  };

  if (step === 'quickInput') {
    return (
      <Box flexDirection="column">
        <Header title="New Round" />
        <PlayerGrid players={data.players} />
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">
            Quick select — type defenders|attackers (e.g. "1,2,3|4,5,6"):
          </Text>
          <Text dimColor>
            Supports numbers (1,3,5), ranges (1-3), all (*). Press enter empty
            for interactive mode. Type "q" to cancel.
          </Text>
        </Box>
        <Box marginTop={1}>
          <TextInput
            placeholder="e.g. 1,2,3|4,5,6"
            onSubmit={(value) => {
              const trimmed = value.trim();
              if (trimmed.toLowerCase() === 'q') {
                onBack();
                return;
              }
              if (trimmed.length === 0) {
                setError('');
                setStep('selectAttackers');
                return;
              }
              const parsed = parseQuickInput(trimmed, data.players);
              if (typeof parsed === 'string') {
                setError(parsed);
                return;
              }
              setError('');
              setAttackers(parsed.attackers);
              setDefenders(parsed.defenders);
              generate(parsed.attackers, parsed.defenders, seed);
            }}
          />
        </Box>
        {error && <StatusMessage variant="error">{error}</StatusMessage>}
      </Box>
    );
  }

  if (step === 'selectAttackers') {
    return (
      <Box flexDirection="column">
        <Header title="New Round \u2014 Select Attackers" />
        <PlayerGrid players={data.players} />
        <Box marginTop={1}>
          <Text color="yellow">
            Select attackers (space to toggle, enter to confirm):
          </Text>
        </Box>
        <MultiSelect
          options={data.players.map((p) => ({ label: p, value: p }))}
          onSubmit={(values: string[]) => {
            if (values.length === 0) {
              setError('Select at least one attacker.');
              return;
            }
            setError('');
            setAttackers(values);
            setStep('selectDefenders');
          }}
        />
        {error && <StatusMessage variant="error">{error}</StatusMessage>}
      </Box>
    );
  }

  if (step === 'selectDefenders') {
    const remaining = data.players.filter((p) => !attackers.includes(p));

    if (remaining.length < attackers.length) {
      return (
        <Box flexDirection="column">
          <Header title="New Round \u2014 Select Defenders" />
          <StatusMessage variant="error">
            Not enough remaining players. Need {attackers.length} defenders but
            only {remaining.length} available.
          </StatusMessage>
          <Box marginTop={1}>
            <Select
              options={[{ label: '\u2190 Back', value: 'back' }]}
              onChange={() => {
                setStep('selectAttackers');
                setAttackers([]);
              }}
            />
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Header title="New Round \u2014 Select Defenders" />
        <Text>
          Attackers ({attackers.length}):{' '}
          <Text color="yellow">{attackers.join(', ')}</Text>
        </Text>
        <Box marginTop={1}>
          <Text color="yellow">
            Select {attackers.length} defender
            {attackers.length !== 1 ? 's' : ''} (space to toggle, enter to
            confirm):
          </Text>
        </Box>
        <MultiSelect
          options={remaining.map((p) => ({ label: p, value: p }))}
          onSubmit={(values: string[]) => {
            if (values.length !== attackers.length) {
              setError(
                `Need exactly ${attackers.length} defender${attackers.length !== 1 ? 's' : ''}, got ${values.length}.`,
              );
              return;
            }
            setError('');
            setDefenders(values);
            generate(attackers, values, seed);
          }}
        />
        {error && <StatusMessage variant="error">{error}</StatusMessage>}
      </Box>
    );
  }

  // step === 'results'
  if (!result) return null;

  return (
    <Box flexDirection="column">
      <Header title="New Round \u2014 Results" />
      <TeamTable
        teams={result.teams}
        metrics={result.metrics}
        historyLength={data.rounds.length}
      />
      <Select
        options={[
          { label: 'Accept', value: 'accept' },
          { label: 'Regenerate', value: 'regenerate' },
          { label: 'Cancel', value: 'cancel' },
        ]}
        onChange={(value) => {
          if (value === 'accept') {
            const newRound: HistoricalRound = {
              timestamp: new Date().toISOString(),
              attackers,
              defenders,
              teams: result.teams.map((t) => ({
                attacker: t.attackerId,
                defender: t.defenderId,
              })),
            };
            onSave({ ...data, rounds: [...data.rounds, newRound] });
            onBack();
          } else if (value === 'regenerate') {
            const s = Date.now();
            setSeed(s);
            generate(attackers, defenders, s);
          } else {
            onBack();
          }
        }}
      />
    </Box>
  );
}
