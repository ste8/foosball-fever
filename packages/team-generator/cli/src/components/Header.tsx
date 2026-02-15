import { Box, Text } from 'ink';

export function Header({ title }: { title: string }) {
  return (
    <Box marginBottom={1}>
      <Text color="cyan" bold>
        {'=== ' + title + ' ==='}
      </Text>
    </Box>
  );
}
