import { useState } from 'react';
import { Box, Text } from 'ink';
import {
  Select,
  MultiSelect,
  TextInput,
  ConfirmInput,
  StatusMessage,
} from '@inkjs/ui';
import { Header } from '../components/Header.js';
import { PlayerGrid } from '../components/PlayerGrid.js';
import type { TournamentData } from '../types.js';

type Step =
  | 'menu'
  | 'add'
  | 'remove'
  | 'removeConfirm'
  | 'rename'
  | 'renameInput';

export function ManagePlayers({
  data,
  onSave,
  onBack,
}: {
  data: TournamentData;
  onSave: (d: TournamentData) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<Step>('menu');
  const [selected, setSelected] = useState<string[]>([]);
  const [renameTarget, setRenameTarget] = useState('');
  const [message, setMessage] = useState<{
    text: string;
    variant: 'success' | 'error';
  } | null>(null);

  if (step === 'menu') {
    return (
      <Box flexDirection="column">
        <Header title="Manage Players" />
        <PlayerGrid players={data.players} />
        {message && (
          <Box marginY={1}>
            <StatusMessage variant={message.variant}>
              {message.text}
            </StatusMessage>
          </Box>
        )}
        <Box marginTop={1}>
          <Select
            options={[
              { label: 'Add player(s)', value: 'add' },
              { label: 'Remove player(s)', value: 'remove' },
              { label: 'Rename player', value: 'rename' },
              { label: '\u2190 Back', value: 'back' },
            ]}
            onChange={(value) => {
              if (value === 'back') return onBack();
              setMessage(null);
              setStep(value as Step);
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === 'add') {
    return (
      <Box flexDirection="column">
        <Header title="Add Players" />
        <Text color="yellow">Enter names (comma-separated):</Text>
        <TextInput
          placeholder="Alice, Bob, Charlie"
          onSubmit={(value) => {
            const names = value
              .split(',')
              .map((n) => n.trim())
              .filter((n) => n.length > 0);
            if (names.length === 0) {
              setMessage({ text: 'No valid names entered.', variant: 'error' });
              setStep('menu');
              return;
            }
            const existing = new Set(
              data.players.map((p) => p.toLowerCase()),
            );
            const added = names.filter(
              (n) => !existing.has(n.toLowerCase()),
            );
            if (added.length === 0) {
              setMessage({
                text: 'All names already exist.',
                variant: 'error',
              });
              setStep('menu');
              return;
            }
            onSave({ ...data, players: [...data.players, ...added] });
            setMessage({
              text: `Added ${added.length} player(s).`,
              variant: 'success',
            });
            setStep('menu');
          }}
        />
      </Box>
    );
  }

  if (step === 'remove') {
    if (data.players.length === 0) {
      setMessage({ text: 'No players to remove.', variant: 'error' });
      setStep('menu');
      return null;
    }
    return (
      <Box flexDirection="column">
        <Header title="Remove Players" />
        <Text color="yellow">Select players to remove:</Text>
        <MultiSelect
          options={data.players.map((p) => ({ label: p, value: p }))}
          onSubmit={(values: string[]) => {
            if (values.length === 0) {
              setStep('menu');
              return;
            }
            setSelected(values);
            setStep('removeConfirm');
          }}
        />
      </Box>
    );
  }

  if (step === 'removeConfirm') {
    return (
      <Box flexDirection="column">
        <Header title="Remove Players" />
        <Text>
          Remove:{' '}
          <Text color="red" bold>
            {selected.join(', ')}
          </Text>
        </Text>
        <Box marginTop={1}>
          <Text color="yellow">Are you sure?</Text>
        </Box>
        <ConfirmInput
          onConfirm={() => {
            const removeSet = new Set(selected);
            onSave({
              ...data,
              players: data.players.filter((p) => !removeSet.has(p)),
            });
            setMessage({
              text: `Removed ${selected.length} player(s).`,
              variant: 'success',
            });
            setStep('menu');
          }}
          onCancel={() => setStep('menu')}
        />
      </Box>
    );
  }

  if (step === 'rename') {
    if (data.players.length === 0) {
      setMessage({ text: 'No players to rename.', variant: 'error' });
      setStep('menu');
      return null;
    }
    return (
      <Box flexDirection="column">
        <Header title="Rename Player" />
        <Text color="yellow">Select player to rename:</Text>
        <Select
          options={data.players.map((p) => ({ label: p, value: p }))}
          onChange={(value) => {
            setRenameTarget(value);
            setStep('renameInput');
          }}
        />
      </Box>
    );
  }

  if (step === 'renameInput') {
    return (
      <Box flexDirection="column">
        <Header title="Rename Player" />
        <Text>
          Renaming:{' '}
          <Text bold color="yellow">
            {renameTarget}
          </Text>
        </Text>
        <Text color="yellow">Enter new name:</Text>
        <TextInput
          placeholder={renameTarget}
          onSubmit={(value) => {
            const newName = value.trim();
            if (newName.length === 0) {
              setMessage({
                text: 'Name cannot be empty.',
                variant: 'error',
              });
              setStep('menu');
              return;
            }
            if (
              data.players.some(
                (p) =>
                  p.toLowerCase() === newName.toLowerCase() &&
                  p !== renameTarget,
              )
            ) {
              setMessage({
                text: `"${newName}" already exists.`,
                variant: 'error',
              });
              setStep('menu');
              return;
            }
            const updated = data.players.map((p) =>
              p === renameTarget ? newName : p,
            );
            onSave({ ...data, players: updated });
            setMessage({
              text: `Renamed "${renameTarget}" \u2192 "${newName}".`,
              variant: 'success',
            });
            setStep('menu');
          }}
        />
      </Box>
    );
  }

  return null;
}
