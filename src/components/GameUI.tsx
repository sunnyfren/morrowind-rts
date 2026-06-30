import React, { useEffect, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Pickaxe, Shield, Coins, Wheat, Activity, Target, ZoomIn, ZoomOut, Maximize, Play, Pause, FastForward } from 'lucide-react';
import { Faction, UnitType, BuildingType } from '../game/constants';

const factionUnitNames: Record<Faction, Record<UnitType, string>> = {
   [Faction.Redoran]: {
     [UnitType.Villager]: 'Citizen',
     [UnitType.Spearman]: 'Redoran Spearman',
     [UnitType.Swordsman]: 'Redoran Swordsman',
     [UnitType.Archer]: 'Redoran Archer',
     [UnitType.Mage]: 'Mage',
     [UnitType.Hero]: 'Hortator',
   },
   [Faction.Telvanni]: {
     [UnitType.Villager]: 'Citizen',
     [UnitType.Spearman]: 'Mercenary',
     [UnitType.Swordsman]: 'Spellsword',
     [UnitType.Archer]: 'Archer',
     [UnitType.Mage]: 'Telvanni Mage',
     [UnitType.Hero]: 'Hortator',
   },
   [Faction.Hlaalu]: {
     [UnitType.Villager]: 'Citizen',
     [UnitType.Spearman]: 'House Guard Spearman',
     [UnitType.Swordsman]: 'House Guard Swordsman',
     [UnitType.Archer]: 'House Guard Archer',
     [UnitType.Mage]: 'Mage',
     [UnitType.Hero]: 'Hortator',
   }
};

interface GameUIProps {
  engine: GameEngine;
}

export function GameUI({ engine }: GameUIProps) {
  // Use a tick to force re-renders from the engine data
  const [, setTick] = useState(0);
  const [showSkillTree, setShowSkillTree] = useState(false);

  useEffect(() => {
    return engine.subscribe(() => setTick(t => t + 1));
  }, [engine]);

  const { player, units, buildings, resources, gameState, gameTime, dayDuration } = engine;
  
  const selectedUnits = units.filter(u => u.selected);
  const selectedBuildings = buildings.filter(b => b.selected);
  const selectedResources = resources.filter(b => b.selected);
  const hasSelection = selectedUnits.length > 0 || selectedBuildings.length > 0 || selectedResources.length > 0;
  
  const timeRatio = (gameTime % dayDuration) / dayDuration;
  const isNight = timeRatio > 0.25 && timeRatio < 0.75; // simplified
  const dayNumber = Math.floor(gameTime / dayDuration) + 1;

  return (
    <div className="pointer-events-none absolute inset-0 font-sans flex flex-col justify-between overflow-hidden">
       {/* State Overlays */}
       {gameState !== 'playing' && (
           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 pointer-events-auto backdrop-blur-sm">
               <h1 className={`text-6xl font-bold font-serif mb-4 ${gameState === 'won' ? 'text-yellow-500' : 'text-red-500'}`}>
                   {gameState === 'won' ? 'VICTORY' : 'DEFEAT'}
               </h1>
               <p className="text-gray-300 text-xl font-serif text-center max-w-lg">
                   {gameState === 'won' ? 'You have crushed all opposition and secured the land for your House.' : 'Your settlement has fallen, and your memory vanishes into the Ashlands.'}
               </p>
               <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-[#2a2b36] hover:bg-[#3a3b46] text-white border border-[#4a4b56] text-lg font-serif tracking-widest transition-colors">
                   Restart Expedition
               </button>
           </div>
       )}
       
       {showSkillTree && (
           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-40 pointer-events-auto backdrop-blur-md">
               <div className="bg-[#1a1b26] border border-[#d4c790]/30 w-3/4 max-w-2xl p-6 rounded-sm">
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-[#d4c790] text-2xl font-serif uppercase tracking-widest">House Technologies</h2>
                       <button onClick={() => setShowSkillTree(false)} className="text-gray-400 hover:text-white">&times;</button>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div className="border border-[#2a2b36] p-4 bg-black/40">
                           <h3 className="text-white text-lg mb-2 flex items-center gap-2"><Pickaxe size={18}/> Economy</h3>
                           <div className="space-y-3">
                               <SkillButton name="GatherEfficiency" label="Better Tools" desc="Villagers gather resources 50% faster." engine={engine} cost="100 Wood, 50 Food" />
                               <SkillButton name="MovementSpeed" label="Swift Boots" desc="All units move slightly faster." engine={engine} cost="100 Wood, 50 Gold" />
                           </div>
                       </div>
                       <div className="border border-[#2a2b36] p-4 bg-black/40">
                           <h3 className="text-white text-lg mb-2 flex items-center gap-2"><Shield size={18}/> Military</h3>
                           <div className="space-y-3">
                               <SkillButton name="AttackDamage" label="Sharpen Steel" desc="Units deal +5 more damage." engine={engine} cost="100 Food, 100 Gold" />
                               <SkillButton name="IronWeapons" label="Iron Weapons" desc="Units deal +2 more damage." engine={engine} cost="100 Food, 50 Gold" />
                               <SkillButton name="SteelArmor" label="Steel Armor" desc="Units have more HP." engine={engine} cost="150 Food, 100 Gold" />
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Top Bar - Resources */}
       <div className="bg-[#1a1b26]/90 border-b border-[#2a2b36] p-2 flex justify-between items-center pointer-events-auto backdrop-blur-md">
           <div className="flex gap-6 px-4">
              <ResourceBadge icon={<Wheat size={18} className="text-[#c23a54]" />} label="Food" value={Math.floor(player.resources.Food)} />
              <ResourceBadge icon={<Pickaxe size={18} className="text-[#4a6f3b]" />} label="Wood" value={Math.floor(player.resources.Wood)} />
              <ResourceBadge icon={<Coins size={18} className="text-[#f2be22]" />} label="Gold" value={Math.floor(player.resources.Gold)} />
           </div>
           
           <div className="text-gray-400 font-mono text-xs flex items-center gap-2">
               <span>Day {dayNumber}</span>
               <span>•</span>
               <span>{isNight ? 'Night' : 'Day'}</span>
           </div>

           <div className="text-[#d4c790] font-bold text-sm tracking-widest px-4 flex gap-4">
               <span>POP: {player.pop} / {player.maxPop}</span>
               <span className="uppercase">House {player.faction}</span>
           </div>
       </div>

       {engine.message && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-[#111] bg-opacity-90 border border-[#d4c790] px-6 py-2 rounded text-[#d4c790] animate-pulse whitespace-nowrap">
              {engine.message}
          </div>
       )}

       {/* Top Right Controls - Speed */}
       <div className="absolute top-16 right-4 flex bg-[#1a1b26]/90 border border-[#2a2b36] rounded-sm pointer-events-auto backdrop-blur-md overflow-hidden shadow-lg">
           <button onClick={() => engine.setSpeed(0)} className={`p-2 transition-colors ${engine.isPaused ? 'bg-[#3a3b46] text-[#d4c790]' : 'hover:bg-[#2a2b36] text-gray-400'}`}>
               <Pause size={18} />
           </button>
           <button onClick={() => engine.setSpeed(1)} className={`p-2 transition-colors border-l border-[#2a2b36] ${!engine.isPaused && engine.timeMultiplier === 1 ? 'bg-[#3a3b46] text-[#d4c790]' : 'hover:bg-[#2a2b36] text-gray-400'}`}>
               <Play size={18} />
           </button>
           <button onClick={() => engine.setSpeed(2)} className={`p-2 flex transition-colors border-l border-[#2a2b36] ${!engine.isPaused && engine.timeMultiplier === 2 ? 'bg-[#3a3b46] text-[#d4c790]' : 'hover:bg-[#2a2b36] text-gray-400'}`}>
               <Play size={18} /><Play size={18} className="-ml-3" />
           </button>
           <button onClick={() => engine.setSpeed(3)} className={`p-2 flex transition-colors border-l border-[#2a2b36] ${!engine.isPaused && engine.timeMultiplier === 3 ? 'bg-[#3a3b46] text-[#d4c790]' : 'hover:bg-[#2a2b36] text-gray-400'}`}>
               <FastForward size={18} />
           </button>
       </div>

       {/* Bottom Panel */}
       <div className="bg-[#1a1b26]/95 border-t border-[#2a2b36] h-48 w-full p-4 flex gap-4 pointer-events-auto backdrop-blur-md transform transition-transform duration-300 relative">
           
           {/* Zoom Controls (Bottom Right of map area) */}
           <div className="absolute -top-16 right-4 flex flex-col bg-[#1a1b26]/90 border border-[#2a2b36] rounded-sm pointer-events-auto backdrop-blur-md shadow-lg">
               <button onClick={() => { engine.camera.zoom = Math.min(3, engine.camera.zoom * 1.5); engine['notify'](); }} className="p-2 hover:bg-[#3a3b46] text-gray-400 hover:text-white transition-colors border-b border-[#2a2b36]">
                   <ZoomIn size={20} />
               </button>
               <button onClick={() => { engine.camera.zoom = Math.max(0.25, engine.camera.zoom / 1.5); engine['notify'](); }} className="p-2 hover:bg-[#3a3b46] text-gray-400 hover:text-white transition-colors border-b border-[#2a2b36]">
                   <ZoomOut size={20} />
               </button>
               <button onClick={() => engine.resetCamera()} className="p-2 hover:bg-[#3a3b46] text-gray-400 hover:text-white transition-colors" title="Full Map View">
                   <Maximize size={20} />
               </button>
           </div>
           
           {/* Map Region */}
           <div className="w-48 h-full bg-black/50 border border-[#3a3b46] rounded-sm hidden md:flex flex-col relative overflow-hidden p-3 justify-between">
               <div className="text-xs text-[#d4c790] font-serif uppercase tracking-wider">
                   {player.faction === Faction.Hlaalu ? 'Ascadian Isles' : player.faction === Faction.Telvanni ? 'Azura\'s Coast' : 'Ashlands'}
               </div>
               <div className="text-[10px] text-gray-500 mt-1">Territory mapping offline</div>
               
               <button 
                  onClick={() => setShowSkillTree(!showSkillTree)} 
                  className="mt-auto w-full py-2 bg-[#2a2b36] hover:bg-[#3a3b46] border border-[#d4c790]/30 text-[#d4c790] text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
               >
                   <Activity size={14} /> Skills
               </button>
           </div>

           {/* Info Panel */}
           <div className="flex-1 border border-[#3a3b46] rounded-sm bg-black/30 p-4 flex flex-col justify-center items-center text-center">
              {!hasSelection && (
                 <p className="text-gray-500 italic">Select units or buildings</p>
              )}
              {selectedUnits.length > 0 && (
                 <div className="flex flex-col items-center">
                    <span className="text-[#d4c790] font-bold text-xl uppercase mb-2">
                       {selectedUnits.length}x {factionUnitNames[selectedUnits[0].faction as Faction]?.[selectedUnits[0].unitType as UnitType] || selectedUnits[0].unitType}
                    </span>
                    <p className="text-sm text-gray-400 capitalize">Action: {selectedUnits[0].action.type}</p>
                 </div>
              )}
              {selectedBuildings.length > 0 && selectedUnits.length === 0 && (
                 <div className="flex flex-col items-center">
                    <span className="text-[#d4c790] font-bold text-xl uppercase">{selectedBuildings[0].buildingType}</span>
                    <span className="text-sm text-gray-500 uppercase mb-1">House {selectedBuildings[0].faction}</span>
                    <span className="text-sm text-green-500">{Math.floor(selectedBuildings[0].hp)} / {selectedBuildings[0].maxHp} HP</span>
                 </div>
              )}
                {selectedResources.length > 0 && selectedUnits.length === 0 && selectedBuildings.length === 0 && (
                 <div className="flex flex-col items-center">
                    <span className="text-[#d4c790] font-bold text-xl uppercase">{selectedResources[0].resourceType}</span>
                    <span className="text-sm text-yellow-500">{Math.floor(selectedResources[0].amount)} Remaining</span>
                 </div>
              )}
           </div>

           {/* Action Panel */}
           <div className="w-64 border border-[#3a3b46] rounded-sm bg-black/30 p-2 grid grid-cols-3 gap-2 overflow-y-auto">
               {/* Contextual actions */}
               {selectedUnits.length > 0 && selectedUnits.every(u => u.faction === engine.player.faction) && (
                   <ActionButton
                      label="Stop Action" cost="" icon={<Pause size={16} />}
                      onClick={() => {
                          selectedUnits.forEach(u => u.action = { type: 'Idle' });
                          engine['notify']();
                      }}
                   />
               )}

               {selectedBuildings.some(b => b.buildingType === 'Town Square') && (
                    <>
                    <ActionButton 
                      label={`Train ${factionUnitNames[player.faction][UnitType.Villager]}`} cost="35 Food, 25 Gold" icon={<Target size={16} />} 
                      onClick={() => engine.buyUnit('Villager' as any, selectedBuildings[0])} 
                   />
                   </>
                )}
               {selectedBuildings.some(b => b.buildingType === 'Barracks') && (
                   <>
                     <ActionButton 
                        label={`Train ${factionUnitNames[player.faction][UnitType.Swordsman]}`} cost="25 Food, 30 Gold, 20 Wood" icon={<Target size={16} />} 
                        onClick={() => engine.buyUnit('Swordsman' as any, selectedBuildings[0])} 
                     />
                     <ActionButton 
                        label={`Train ${factionUnitNames[player.faction][UnitType.Spearman]}`} cost="25 Food, 30 Gold, 20 Wood" icon={<Target size={16} />} 
                        onClick={() => engine.buyUnit('Spearman' as any, selectedBuildings[0])} 
                     />
                     {player.faction === Faction.Telvanni ? (
                         <ActionButton 
                            label={`Train ${factionUnitNames[player.faction][UnitType.Mage]}`} cost="25 Food, 30 Gold, 20 Wood" icon={<Target size={16} />} 
                            onClick={() => engine.buyUnit('Mage' as any, selectedBuildings[0])} 
                         />
                     ) : (
                         <ActionButton 
                            label={`Train ${factionUnitNames[player.faction][UnitType.Archer]}`} cost="25 Food, 30 Gold, 20 Wood" icon={<Target size={16} />} 
                            onClick={() => engine.buyUnit('Archer' as any, selectedBuildings[0])} 
                         />
                     )}
                   </>
               )}
               {selectedBuildings.some(b => b.buildingType === 'Temple') && (
                   <ActionButton 
                      label="Summon Hortator" cost="200 Food, 200 Gold, 100 Wood" icon={<Target size={16} />} 
                      onClick={() => {
                          const hasAll = [BuildingType.House, BuildingType.Barracks, BuildingType.Smithy, BuildingType.Temple].every(type => engine.buildings.some(b => b.faction === engine.player.faction && b.buildingType === type));
                          if (!hasAll) {
                              engine.notifyMessage('You must build all structures first (House, Barracks, Smithy, Temple)!');
                              return;
                          }
                          engine.buyUnit('Hortator' as any, selectedBuildings[0]);
                      }} 
                   />
               )}
               {selectedBuildings.some(b => b.buildingType === 'Smithy') && (
                   <div className="text-gray-500 text-xs flex flex-col justify-center items-center h-full col-span-3 text-center px-4">
                       Smithy grants access to military technologies in the Skill Tree.
                   </div>
               )}
               
               {selectedUnits.some(u => u.unitType === 'Villager') && (
                   <>
                     <ActionButton 
                        label="Build Town Hall" cost="100 Wood, 100 Gold, 40 Food" icon={<Activity size={16} />} 
                        onClick={() => engine.buyBuilding('Town Square' as any, selectedUnits.find(u => u.unitType === 'Villager')!)} 
                     />
                     <ActionButton 
                        label="Build House" cost="100 Wood, 100 Gold, 40 Food" icon={<Pickaxe size={16} />} 
                        onClick={() => engine.buyBuilding('House' as any, selectedUnits.find(u => u.unitType === 'Villager')!)} 
                     />
                     <ActionButton 
                        label="Barracks" cost="100 Wood, 100 Gold, 40 Food" icon={<Shield size={16} />} 
                        onClick={() => engine.buyBuilding('Barracks' as any, selectedUnits.find(u => u.unitType === 'Villager')!)} 
                     />
                     <ActionButton 
                        label="Smithy" cost="100 Wood, 100 Gold, 40 Food" icon={<Activity size={16} />} 
                        onClick={() => engine.buyBuilding('Smithy' as any, selectedUnits.find(u => u.unitType === 'Villager')!)} 
                     />
                     <ActionButton 
                        label="Temple" cost="100 Wood, 100 Gold, 40 Food" icon={<Activity size={16} />} 
                        onClick={() => engine.buyBuilding('Temple' as any, selectedUnits.find(u => u.unitType === 'Villager')!)} 
                     />
                   </>
               )}
           </div>
       </div>
    </div>
  );
}

function ResourceBadge({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
     <div className="flex items-center gap-2" title={label}>
        {icon}
        <span className="text-white font-mono text-sm">{value}</span>
     </div>
  );
}

function ActionButton({ label, cost, icon, onClick }: { label: string, cost: string, icon: React.ReactNode, onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center bg-[#2a2b36] hover:bg-[#3a3b46] border border-[#4a4b56] rounded-sm p-1 text-xs transition-colors group h-14">
            <div className="text-gray-300 group-hover:text-white mb-0.5">{icon}</div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center leading-tight">{label}</span>
            <span className="text-[8px] text-[#f2be22] font-mono leading-tight">{cost}</span>
        </button>
    );
}

function SkillButton({ name, label, desc, cost, engine }: { name: string, label: string, desc: string, cost: string, engine: GameEngine }) {
    const hasUpgrade = engine.player.upgrades.includes(name);
    return (
        <button 
           onClick={() => !hasUpgrade && engine.buyUpgrade(name)} 
           disabled={hasUpgrade}
           className={`w-full flex justify-between items-center p-3 border rounded-sm transition-colors text-left ${hasUpgrade ? 'bg-[#1a1b22] border-[#2a2b36] opacity-50 cursor-not-allowed' : 'bg-[#2a2b36] hover:bg-[#3a3b46] border-[#4a4b56]'}`}
        >
            <div>
               <div className={`font-bold ${hasUpgrade ? 'text-gray-500' : 'text-[#d4c790]'}`}>{label} {hasUpgrade && '(Researched)'}</div>
               <div className="text-xs text-gray-400 mt-1">{desc}</div>
            </div>
            {!hasUpgrade && <div className="text-xs text-[#f2be22] font-mono whitespace-nowrap ml-4">{cost}</div>}
        </button>
    );
}
