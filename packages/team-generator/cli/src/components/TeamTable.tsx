import { Box, Text } from 'ink';
import type { GeneratedTeam, GenerationMetrics } from '../../../src/types.js';

export function TeamTable({
  teams,
  metrics,
  historyLength,
}: {
  teams: GeneratedTeam[];
  metrics: GenerationMetrics;
  historyLength: number;
}) {
  const maxDef = Math.max(...teams.map((t) => t.defenderId.length), 8);

  return (
    <Box flexDirection="column" marginY={1}>
      <Text color="green" bold>
        Generated Teams:
      </Text>
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="green"
        paddingX={1}
        marginTop={1}
      >
        {teams.map((t) => (
          <Box key={t.teamNumber}>
            <Text dimColor>
              {String(t.teamNumber).padStart(3) + '  '}
            </Text>
            <Text color="cyan">
              {('\uD83D\uDEE1\uFE0F ' + t.defenderId).padEnd(maxDef + 5)}
            </Text>
            <Text>{' + '}</Text>
            <Text color="yellow">{'\u2694\uFE0F ' + t.attackerId}</Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {'Depth: ' +
            metrics.freshMatchDays +
            '/' +
            historyLength +
            ' \u00B7 Repeated: ' +
            metrics.repeatedCount +
            ' \u00B7 ' +
            metrics.calculationTimeMs.toFixed(1) +
            'ms'}
        </Text>
      </Box>
    </Box>
  );
}
