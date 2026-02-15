import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import { Header } from '../components/Header.js';
import type { TournamentData } from '../types.js';

export type Screen =
  | 'main'
  | 'newRound'
  | 'managePlayers'
  | 'viewHistory'
  | 'undoLastRound';

export function MainMenu({
  data,
  onSelect,
}: {
  data: TournamentData;
  onSelect: (screen: Screen | 'exit') => void;
}) {
  return (
    <Box flexDirection="column">
      <Header title="Foosball Fever" />
      <Box marginBottom={1}>
        <Text dimColor>
          {data.players.length +
            ' player' +
            (data.players.length !== 1 ? 's' : '') +
            ' \u00B7 ' +
            data.rounds.length +
            ' round' +
            (data.rounds.length !== 1 ? 's' : '')}
        </Text>
      </Box>
      <Select
        options={[
          { label: 'New Round', value: 'newRound' },
          { label: 'View History', value: 'viewHistory' },
          { label: 'Manage Players', value: 'managePlayers' },
          { label: 'Undo Last Round', value: 'undoLastRound' },
          { label: 'Exit', value: 'exit' },
        ]}
        onChange={(value) => onSelect(value as Screen | 'exit')}
      />
    </Box>
  );
}
