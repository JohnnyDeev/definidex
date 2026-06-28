import React, { useState, useEffect } from 'react';
import { Swords, Download, TrendingUp, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { typeColors } from './TypeBadge';

import metaPokemonData from '../data/vgc-meta.json';

interface PokemonMeta {
    id: number;
    name: string;
    usage: string;
    item: string;
    ability: string;
    moves: string[];
}

export function VgcRadar() {
    const { t } = useLanguage();
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(0);
    const [imported, setImported] = useState<number | null>(null);

    const totalPokemon = 20;
    const perPage = 2;
    const totalPages = Math.ceil(totalPokemon / perPage);

    useEffect(() => {
        fetch(`/data/metadata.json?t=${Date.now()}`, { cache: 'no-store' })
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

    const getUsageBadgeStyle = (usage: string) => {
        const num = parseFloat(usage);
        if (num >= 50) return 'bg-red-600 text-white';
        if (num >= 30) return 'bg-red-500 text-white';
        if (num >= 20) return 'bg-orange-500 text-white';
        if (num >= 10) return 'bg-yellow-500 text-black';
        return 'bg-zinc-500 text-white';
    };

    const nextPage = () => {
        if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
    };

    const prevPage = () => {
        if (currentPage > 0) setCurrentPage(prev => prev - 1);
    };

    const handleImport = (pokemon: PokemonMeta, e: React.MouseEvent) => {
        e.stopPropagation();
        setImported(pokemon.id);
        setTimeout(() => setImported(null), 2000);
    };

    const formatPokemonName = (name: string) => {
        return name
            .replace(/-/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const formatMoveName = (move: string) => {
        return move
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const formatItemName = (item: string) => {
        return item
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const getPagePokemon = () => {
        const start = currentPage * perPage;
        return metaPokemonData.pokemon.slice(start, start + perPage);
    };

    return (
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Swords className="text-red-500" size={24} />
                    <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">
                        {(t as any).vgcRadar || 'VGC Meta'}
                    </h3>
                </div>
                {lastUpdated && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 rounded-full border border-zinc-800">
                        <Clock size={10} className="text-red-500" />
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                            {getRelativeTime(lastUpdated)}
                        </span>
                    </div>
                )}
            </div>

            {/* Title + Meta Info */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-red-400" />
                    <h4 className="text-zinc-300 font-bold text-sm tracking-wide uppercase">{(t as any).topMetaPokemon || 'Top 20 Meta Pokémon'}</h4>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                    {metaPokemonData.format.toUpperCase()} • {metaPokemonData.month}
                </span>
            </div>

            {/* Pokemon Cards Container */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getPagePokemon().map((pokemon, index) => {
                        const globalRank = currentPage * perPage + index;
                        return (
                            <div
                                key={pokemon.id}
                                className="bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 rounded-2xl border border-zinc-700 overflow-hidden hover:border-red-500/50 transition-all duration-300"
                            >
                                {/* Header: Rank + Usage */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-white text-red-600 flex items-center justify-center text-sm font-black shadow-lg">
                                            {globalRank === 0 ? '👑' : globalRank === 1 ? '🥈' : globalRank === 2 ? '🥉' : `#${globalRank + 1}`}
                                        </div>
                                        <span className="text-white font-bold text-xs uppercase tracking-wider">Meta Pokémon</span>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getUsageBadgeStyle(pokemon.usage)}`}>
                                        {pokemon.usage}
                                    </div>
                                </div>

                                {/* Pokemon Sprite */}
                                <div className="relative aspect-square bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center p-4">
                                    <img
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                                        alt={formatPokemonName(pokemon.name)}
                                        className="w-32 h-32 object-contain drop-shadow-lg z-10 hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png`;
                                        }}
                                    />
                                </div>

                                {/* Pokemon Name */}
                                <div className="px-4 py-2 text-center bg-zinc-950/50 border-y border-zinc-800">
                                    <h5 className="text-white font-black text-sm italic uppercase tracking-tight">
                                        {formatPokemonName(pokemon.name)}
                                    </h5>
                                </div>

                                {/* Item + Ability */}
                                <div className="flex items-center justify-center gap-4 px-4 py-3 bg-zinc-900/50">
                                    {/* Item */}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-xl border-2 border-zinc-700 flex items-center justify-center p-2 shadow-inner">
                                            <img
                                                src={getItemSpriteUrl(pokemon.item)}
                                                alt={formatItemName(pokemon.item)}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide truncate max-w-[90px] text-center">
                                            {formatItemName(pokemon.item)}
                                        </span>
                                    </div>

                                    {/* Ability */}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-10 h-10 bg-red-500/10 rounded-xl border-2 border-red-500/30 flex items-center justify-center">
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg" />
                                        </div>
                                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-wide truncate max-w-[90px] text-center">
                                            {formatMoveName(pokemon.ability)}
                                        </span>
                                    </div>
                                </div>

                                {/* Moves */}
                                <div className="p-3 bg-zinc-950/30">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {pokemon.moves.slice(0, 4).map((move, i) => (
                                            <div
                                                key={i}
                                                className="bg-zinc-900 rounded-lg px-2 py-2 text-[8px] text-zinc-300 font-bold uppercase tracking-tight truncate text-center border border-zinc-800 hover:border-red-500/30 transition-colors"
                                            >
                                                {formatMoveName(move)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Import Button */}
                                <div className="p-3">
                                    <button
                                        onClick={(e) => handleImport(pokemon, e)}
                                        className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${imported === pokemon.id
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg'
                                            }`}
                                    >
                                        {imported === pokemon.id ? (
                                            <>
                                                <Check size={14} strokeWidth={3} />
                                                Importado!
                                            </>
                                        ) : (
                                            <>
                                                <Download size={14} strokeWidth={2.5} />
                                                {(t as any).importToMyTeams || 'Importar'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentPage === 0
                            ? 'border-zinc-700 text-zinc-600 cursor-not-allowed'
                            : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                >
                    <ChevronLeft size={20} strokeWidth={3} />
                </button>

                {/* Page Indicators */}
                <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${currentPage === i
                                    ? 'bg-red-500 w-6'
                                    : 'bg-zinc-700 hover:bg-zinc-600'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages - 1}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentPage === totalPages - 1
                            ? 'border-zinc-700 text-zinc-600 cursor-not-allowed'
                            : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                >
                    <ChevronRight size={20} strokeWidth={3} />
                </button>
            </div>

            {/* Info Footer */}
            <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Swords size={12} className="text-zinc-500" />
                    <span className="text-[9px] text-zinc-500 font-medium">
                        {(t as any).vgcSource || 'Fonte: Smogon Usage Stats'}
                    </span>
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">
                    Página {currentPage + 1} de {totalPages} • {currentPage * perPage + 1}-{Math.min((currentPage + 1) * perPage, totalPokemon)} de {totalPokemon}
                </span>
            </div>
        </div>
    );
}
