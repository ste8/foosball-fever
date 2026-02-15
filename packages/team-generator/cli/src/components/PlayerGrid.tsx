import { Box, Text } from 'ink';

const COLUMNS = 4;

export function PlayerGrid({
  players,
  numbered = true,
}: {
  players: string[];
  numbered?: boolean;
}) {
  if (players.length === 0) {
    return <Text color="yellow">No players registered.</Text>;
  }

  const maxLen = Math.max(...players.map((p) => p.length));
  const colWidth = maxLen + (numbered ? 6 : 2);

  const rows: string[][] = [];
  for (let i = 0; i < players.length; i += COLUMNS) {
    rows.push(players.slice(i, i + COLUMNS));
  }

  return (
    <Box flexDirection="column">
      {rows.map((row, ri) => (
        <Box key={ri}>
          {row.map((player, ci) => {
            const idx = ri * COLUMNS + ci;
            const label = numbered
              ? `${String(idx + 1).padStart(2)}. ${player}`
              : player;
            return <Text key={ci}>{label.padEnd(colWidth)}</Text>;
          })}
        </Box>
      ))}
    </Box>
  );
}
