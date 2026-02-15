import { useState } from 'react';
import { Box, Text } from 'ink';
import { Select, StatusMessage } from '@inkjs/ui';
import { Header } from '../components/Header.js';
import type { TournamentData } from '../types.js';

const INITIAL_LIMIT = 10;

export function ViewHistory({
  data,
  onBack,
}: {
  data: TournamentData;
  onBack: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  if (data.rounds.length === 0) {
    return (
      <Box flexDirection="column">
        <Header title="Round History" />
        <StatusMessage variant="info">No rounds played yet.</StatusMessage>
        <Box marginTop={1}>
          <Select
            options={[{ label: '\u2190 Back', value: 'back' }]}
            onChange={() => onBack()}
          />
        </Box>
      </Box>
    );
  }

  const limit = showAll
    ? data.rounds.length
    : Math.min(INITIAL_LIMIT, data.rounds.length);

  return (
    <Box flexDirection="column">
      <Header title="Round History" />
      <Text dimColor>
        Showing {limit} of {data.rounds.length} round
        {data.rounds.length !== 1 ? 's' : ''} (newest first):
      </Text>
      <Box flexDirection="column" marginY={1}>
        {Array.from({ length: limit }, (_, offset) => {
          const i = data.rounds.length - 1 - offset;
          const round = data.rounds[i];
          const date = new Date(round.timestamp);
          const dateStr = date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text bold>
                Round {i + 1} \u2014 {dateStr}
              </Text>
              <Text dimColor>
                {'  Defenders: ' + round.defenders.join(', ')}
              </Text>
              <Text dimColor>
                {'  Attackers: ' + round.attackers.join(', ')}
              </Text>
              {round.teams.map((t, ti) => (
                <Text key={ti}>
                  {'    \uD83D\uDEE1\uFE0F ' +
                    t.defender +
                    ' + \u2694\uFE0F ' +
                    t.attacker}
                </Text>
              ))}
            </Box>
          );
        })}
      </Box>
      <Select
        options={[
          ...(data.rounds.length > INITIAL_LIMIT && !showAll
            ? [{ label: 'Show all rounds', value: 'showAll' }]
            : []),
          { label: '\u2190 Back', value: 'back' },
        ]}
        onChange={(value) => {
          if (value === 'showAll') setShowAll(true);
          else onBack();
        }}
      />
    </Box>
  );
}
