import { useState } from 'react';
import { useApp } from 'ink';
import { MainMenu, type Screen } from './screens/MainMenu.js';
import { NewRound } from './screens/NewRound.js';
import { ManagePlayers } from './screens/ManagePlayers.js';
import { ViewHistory } from './screens/ViewHistory.js';
import { UndoLastRound } from './screens/UndoLastRound.js';
import { loadData, saveData } from './persistence.js';
import type { TournamentData } from './types.js';
import { resolve } from 'node:path';

const DATA_PATH = resolve('tournament.json');

export function App() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>('main');
  const [data, setData] = useState<TournamentData>(() => loadData(DATA_PATH));

  const handleSave = (newData: TournamentData) => {
    setData(newData);
    saveData(DATA_PATH, newData);
  };

  const handleBack = () => setScreen('main');

  const handleMenuSelect = (target: Screen | 'exit') => {
    if (target === 'exit') {
      exit();
      return;
    }
    setScreen(target);
  };

  switch (screen) {
    case 'main':
      return <MainMenu data={data} onSelect={handleMenuSelect} />;
    case 'newRound':
      return (
        <NewRound data={data} onSave={handleSave} onBack={handleBack} />
      );
    case 'managePlayers':
      return (
        <ManagePlayers data={data} onSave={handleSave} onBack={handleBack} />
      );
    case 'viewHistory':
      return <ViewHistory data={data} onBack={handleBack} />;
    case 'undoLastRound':
      return (
        <UndoLastRound data={data} onSave={handleSave} onBack={handleBack} />
      );
  }
}
