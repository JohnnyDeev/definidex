import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import vgcData from '../data/vgc-meta.json';

interface VGCPokemon {
    id: number;
    name: string;
    usage: string;
    item: string;
    moves: string[];
}

export function VGCStats({ onSelect }: { onSelect: (pokemon: VGCPokemon) => void }) {
    const { t } = useLanguage();
    const [stats, setStats] = useState<VGCPokemon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use the dynamically generated stats from our local JSON
        if (vgcData && vgcData.pokemon) {
            setStats(vgcData.pokemon as VGCPokemon[]);
        }
        setLoading(false);
    }, []);


    if (loading) {
        return (
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 animate-pulse">
                <div className="h-6 w-32 bg-zinc-200 rounded mb-4" />
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-zinc-100 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-red-500" />
                    <h3 className="font-bold text-lg">{t.vgcUsage || 'VGC Top Meta'}</h3>
                </div>
                <div className="group relative">
                    <Info size={16} className="text-zinc-400 cursor-help" />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
                        Format: {vgcData.format} ({vgcData.month})<br />
                        Last updated: {vgcData.lastUpdated}
                    </div>
                </div>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {stats.map((p, idx) => (
                    <div key={p.id} className="group flex items-center gap-3 p-2 bg-zinc-50 hover:bg-red-50 rounded-2xl border border-zinc-100 transition-all">
                        <div className="w-6 text-[10px] font-black text-zinc-400">#{idx + 1}</div>
                        <div className="relative w-10 h-10 bg-white rounded-lg border border-zinc-200 flex items-center justify-center overflow-hidden">
                            <img
                                src={p.id > 0
                                    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
                                    : `https://img.pokemondb.net/sprites/sword-shield/icon/${p.name.toLowerCase().replace(/ /g, '-').replace(/[.-]/g, '')}.png`
                                }
                                alt={p.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://img.pokemondb.net/sprites/sword-shield/icon/${p.name.toLowerCase().replace(/ /g, '-').replace(/[.-]/g, '')}.png`;
                                }}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate capitalize">{p.name.replace(/-/g, ' ')}</p>
                            <div className="flex items-center gap-2">
                                <div className="h-1 rounded-full bg-zinc-200 flex-1 overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: p.usage }} />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500">{p.usage}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onSelect(p)}
                            className="p-2 bg-white text-zinc-400 hover:text-red-600 hover:bg-red-100 rounded-xl border border-zinc-200 transition-all opacity-0 group-hover:opacity-100"
                            title={t.addToTeam}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
