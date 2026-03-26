import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Swords, Info, Download, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { typeColors } from './TypeBadge';
import { HighlightModal } from './HighlightModal';

import metaTeamsData from '../data/vgc-teams.json';

export function VgcRadar() {
    const { t } = useLanguage();
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        fetch('/data/metadata.json')
            .then(res => res.json())
            .then(data => {
                if (data?.vgc?.lastUpdated) {
                    setLastUpdated(data.vgc.lastUpdated);
                }
            })
            .catch(() => { });
    }, []);

    const getRelativeTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Atualizado hoje';
        if (diffDays === 1) return 'Atualizado ontem';
        if (diffDays < 7) return `Atualizado há ${diffDays} dias`;
        return `Atualizado em ${date.toLocaleDateString('pt-BR')}`;
    };

    const getItemSpriteUrl = (itemName: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;

    return (
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Swords className="text-purple-500" size={24} />
                    <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">
                        {(t as any).vgcRadar || 'VGC Radar'}
                    </h3>
                </div>
                {lastUpdated && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 rounded-full border border-zinc-800">
                        <Clock size={10} className="text-purple-500" />
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                            {getRelativeTime(lastUpdated)}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-300 font-bold text-sm tracking-wide uppercase">{(t as any).currentMeta || 'Current Meta Teams'}</h4>
            </div>

            <div className="flex flex-col gap-4 flex-1 justify-center">
                {metaTeamsData.map((team, index) => (
                    <div key={team.id} className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 group hover:border-purple-500/50 transition-colors relative cursor-pointer">

                        {/* Card Background */}
                        <div
                            className="absolute inset-0 z-0"
                            onClick={() => setSelectedTeam(team)}
                        />

                        {/* Index Badge */}
                        <div className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-zinc-900 shadow-lg z-10 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-zinc-400' : 'bg-orange-600'}`}>
                            #{index + 1}
                        </div>

                        <div className="flex justify-between items-start mb-3 pl-4">
                            <h5 className="text-white font-black italic text-lg leading-none">{team.name}</h5>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle download/import if needed here. For now, it just opens the modal too, or does something else.
                                    setSelectedTeam(team);
                                }}
                                className="text-purple-500 bg-purple-500/10 hover:bg-purple-500 hover:text-white p-2 rounded-xl transition-colors flex items-center justify-center shadow-inner relative z-20"
                                title={(t as any).importToMyTeams || "Import to My Teams"}
                            >
                                <Download size={16} />
                            </button>
                        </div>

                        <div className="flex gap-2 justify-between">
                            {team.pokemons.map((pokemon, i) => (
                                <div key={i} className="flex-1 relative aspect-square bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center group/mon hover:bg-zinc-800 transition-colors">
                                    {pokemon.types && pokemon.types[0] && (
                                        <div className={`absolute inset-0 opacity-10 rounded-xl ${typeColors[pokemon.types[0]].split(' ')[0]}`} />
                                    )}
                                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`} alt={pokemon.name} className="w-full h-full object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] z-10" />

                                    {/* Held Item Indicator */}
                                    {pokemon.item && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center p-0.5 shadow-md z-20">
                                            <img src={getItemSpriteUrl(pokemon.item)} alt={pokemon.item} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        </div>
                                    )}

                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded hidden group-hover/mon:block whitespace-nowrap z-50 shadow-lg pointer-events-none">
                                        {pokemon.name.replace('-', ' ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {selectedTeam && (
                    <HighlightModal
                        item={{
                            ...selectedTeam,
                            // Add mock data for the modal to display properly
                            userName: 'VGC Meta',
                            likesCount: Math.floor(Math.random() * 50) + 10,
                            contributionCount: 999
                        }}
                        type="vgc"
                        onClose={() => setSelectedTeam(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
