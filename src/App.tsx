import { useState, useEffect } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { FactionSelect } from './components/FactionSelect';
import { CanvasView } from './components/CanvasView';
import { GameUI } from './components/GameUI';
import { GameEngine } from './game/GameEngine';
import { Faction } from './game/constants';

type AppState = 'title' | 'faction' | 'game';

export default function App() {
  const [appState, setAppState] = useState<AppState>('title');
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [bgEngine, setBgEngine] = useState<GameEngine | null>(null);
  const [bgFaction, setBgFaction] = useState<Faction>(Faction.Redoran);

  useEffect(() => {
    // Cycle the background faction every 8 seconds on the faction screen
    if (appState === 'faction') {
      const factions = [Faction.Redoran, Faction.Hlaalu, Faction.Telvanni];
      const interval = setInterval(() => {
        setBgFaction(prev => {
          const idx = factions.indexOf(prev);
          return factions[(idx + 1) % factions.length];
        });
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [appState]);

  useEffect(() => {
    if (appState === 'faction') {
       if (bgEngine) bgEngine.stop();
       const newEngine = new GameEngine(bgFaction);
       
       // Center camera on the player's town center to show the landscape
       const myTc = newEngine.buildings.find(b => b.faction === bgFaction && b.buildingType === 'TownCenter' as any);
       if (myTc) {
           newEngine.camera.zoom = 1.2;
           // The camera update in the engine loop will handle panning, we just give it a head start
       }
       
       newEngine.start();
       setBgEngine(newEngine);
    } else {
       if (bgEngine) {
           bgEngine.stop();
           setBgEngine(null);
       }
    }
    
    return () => {
       if (bgEngine) bgEngine.stop();
    };
  }, [bgFaction, appState]);

  const handleStartGame = (faction: Faction) => {
    const newEngine = new GameEngine(faction);
    newEngine.audio.init();
    newEngine.start();
    setEngine(newEngine);
    setAppState('game');
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-black relative select-none">
       {/* Background Engine for Faction Screen */}
       {appState === 'faction' && bgEngine && (
          <div className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000">
             <CanvasView engine={bgEngine} />
          </div>
       )}

       {appState === 'title' && (
          <TitleScreen onStart={() => setAppState('faction')} />
       )}
       {appState === 'faction' && (
          <FactionSelect onSelect={handleStartGame} onHover={setBgFaction} />
       )}
       {appState === 'game' && engine && (
          <>
             <CanvasView engine={engine} />
             <GameUI engine={engine} />
          </>
       )}
    </div>
  );
}
