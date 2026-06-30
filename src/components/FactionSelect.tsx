import React from 'react';
import { Faction } from '../game/constants';
import { HlaaluLogo, RedoranLogo, TelvanniLogo } from './FactionLogos';

interface FactionSelectProps {
  onSelect: (f: Faction) => void;
  onHover?: (f: Faction) => void;
}

export function FactionSelect({ onSelect, onHover }: FactionSelectProps) {
  const factions = [
    {
       name: Faction.Hlaalu,
       desc: 'Merchants and traders. Excel at resource gathering.',
       color: 'hover:border-yellow-500 hover:shadow-yellow-500/50',
       bg: 'from-amber-900 to-[#1b1c11]',
       svg: (
         <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-900 to-[#222312] overflow-hidden group">
            {/* Background texture */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #fbbf24 1px, transparent 1px), linear-gradient(-45deg, #fbbf24 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
            
            <div className="z-10 relative flex flex-col items-center group-hover:scale-105 transition-transform duration-500">
               <div className="w-52 h-52 drop-shadow-[0_10px_20px_rgba(234,179,8,0.4)]">
                 <HlaaluLogo />
               </div>
            </div>
         </div>
       )
    },
    {
       name: Faction.Redoran,
       desc: 'Noble warriors. Stronger militia and formidable structures.',
       color: 'hover:border-red-500 hover:shadow-red-500/50',
       bg: 'from-red-900 to-stone-950',
       svg: (
         <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3b0909] to-[#120505] overflow-hidden group">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 20px 20px', backgroundSize: '40px 40px' }} />
            
            <div className="z-10 relative flex flex-col items-center group-hover:scale-105 transition-transform duration-500">
               <div className="w-52 h-52 drop-shadow-[0_10px_25px_rgba(220,38,38,0.5)]">
                 <RedoranLogo />
               </div>
            </div>
         </div>
       )
    },
    {
       name: Faction.Telvanni,
       desc: 'Wizard lords. Unique magical technology and organic architecture.',
       color: 'hover:border-purple-500 hover:shadow-purple-500/50',
       bg: 'from-cyan-900 to-purple-950',
       svg: (
         <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950 overflow-hidden group">
             {/* Magical nebula background */}
             <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/30 to-transparent blur-2xl" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
             
             <div className="z-10 relative flex flex-col items-center group-hover:scale-105 transition-transform duration-500">
               <div className="w-52 h-52 drop-shadow-[0_0_30px_rgba(192,132,252,0.6)]">
                 <TelvanniLogo />
               </div>
             </div>
         </div>
       )
    }
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-50 overflow-hidden font-serif bg-transparent">
       <div className="absolute inset-0 bg-black/40 pointer-events-none" />

       <div className="text-center mb-12 animate-fade-in relative z-20">
           <h1 className="text-5xl md:text-7xl font-bold tracking-[0.1em] text-[#d4c790] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-4 uppercase">
              Select Great House
           </h1>
           <p className="text-[#e5d9a5] text-xl max-w-2xl mx-auto drop-shadow-md">
              Choose your Great House and secure your dominion over Vvardenfell.
           </p>
       </div>
       
       <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center z-10">
          {factions.map((f, i) => (
             <button 
                key={f.name}
                onClick={() => onSelect(f.name)}
                onMouseEnter={() => onHover && onHover(f.name)}
                className={`group relative flex flex-col items-center bg-[#1a1b26] border-2 border-[#2a2b36] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 w-full md:w-1/3 hover:-translate-y-2 ${f.color} ${
                  i === 0 ? 'animate-fade-in-delayed' : i === 1 ? 'animate-fade-in-delayed-2' : 'animate-fade-in-delayed-3'
                }`}
             >
                <div className="w-full aspect-[4/3] bg-black overflow-hidden relative">
                   {f.svg}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b26] to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300" />
                </div>
                <div className="p-6 text-center z-10 relative bg-gradient-to-b from-[#1a1b26] to-[#0f1016] w-full border-t border-[#2a2b36]">
                    <h2 className="text-3xl font-bold text-[#d4c790] uppercase tracking-wider mb-2">House {f.name}</h2>
                    <p className="text-gray-400 text-sm leading-relaxed min-h-[40px]">{f.desc}</p>
                </div>
             </button>
          ))}
       </div>
    </div>
  );
}

