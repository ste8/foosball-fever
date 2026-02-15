import { Box, Text } from 'ink';
import { ConfirmInput, Select, StatusMessage } from '@inkjs/ui';
import { Header } from '../components/Header.js';
import type { TournamentData } from '../types.js';

export function UndoLastRound({
  data,
  onSave,
  onBack,
}: {
  data: TournamentData;
  onSave: (d: TournamentData) => void;
  onBack: () => void;
}) {
  if (data.rounds.length === 0) {
    return (
      <Box flexDirection="column">
        <Header title="Undo Last Round" />
        <StatusMessage variant="info">No rounds to undo.</StatusMessage>
        <Box marginTop={1}>
          <Select
            options={[{ label: '\u2190 Back', value: 'back' }]}
            onChange={() => onBack()}
          />
        </Box>
      </Box>
    );
  }

  const last = data.rounds[data.rounds.length - 1];
  const date = new Date(last.timestamp);
  const dateStr = date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Box flexDirection="column">
      <Header title="Undo Last Round" />
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>
          Round {data.rounds.length} \u2014 {dateStr}
        </Text>
        <Text dimColor>
          {'  Defenders: ' + last.defenders.join(', ')}
        </Text>
        <Text dimColor>
          {'  Attackers: ' + last.attackers.join(', ')}
        </Text>
        {last.teams.map((t, i) => (
          <Text key={i}>
            {'    \uD83D\uDEE1\uFE0F ' +
              t.defender +
              ' + \u2694\uFE0F ' +
              t.attacker}
          </Text>
        ))}
      </Box>
      <Text color="yellow">Remove this round from history?</Text>
      <ConfirmInput
        onConfirm={() => {
          onSave({ ...data, rounds: data.rounds.slice(0, -1) });
          onBack();
        }}
        onCancel={() => onBack()}
      />
    </Box>
  );
}
