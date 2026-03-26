import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, Flame, Gamepad2, Sparkles, Star, Users, ArrowRight, Layers, Swords, Shield, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCommunityHighlight, type SavedDeck, type SavedTeam, countDeckCards } from '../lib/firestoreUtils';
import { MarketRadar } from './MarketRadar';
import { VgcRadar } from './VgcRadar';
import { RankAvatar } from './RankAvatar';
import { HighlightModal } from './HighlightModal';

// ─── Types ───────────────────────────────────────
interface NewsArticle {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    snippet: string;
    source: string;
    category: 'vgc' | 'tcg' | 'games-anime';
    image?: string;
}

interface NewsData {
    lastUpdated: string;
    articles: NewsArticle[];
}

type NewsTab = 'vgc' | 'tcg' | 'games-anime';

// ─── Category Config ─────────────────────────────
const categoryConfig = {
    vgc: {
        label: 'VGC',
        icon: Swords,
        gradient: 'from-purple-500 to-indigo-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-700',
        accent: 'text-purple-600',
    },
    tcg: {
        label: 'TCG',
        icon: Sparkles,
        gradient: 'from-amber-500 to-orange-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        accent: 'text-amber-600',
    },
    'games-anime': {
        label: 'Games',
        icon: Gamepad2,
        gradient: 'from-blue-500 to-cyan-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        accent: 'text-blue-600',
    },
};

// ─── Date Formatter ──────────────────────────────
function formatDate(dateStr: string, lang: string): string {
    try {
        const locale = lang === 'pt-BR' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
        return new Date(dateStr).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

// ─── Pokemon Fallback Images ─────────────────────
// Different Pokemon for each news card fallback
const POKEMON_FALLBACKS = [
    '25',   // Pikachu
    '6',    // Charizard
    '9',    // Blastoise
    '3',    // Venusaur
    '150',  // Mewtwo
    '149',  // Dragonite
    '248',  // Tyranitar
    '282',  // Gardevoir
    '448',  // Lucario
    '493',  // Arceus
    '6',    // Charizard (Mega)
    '94',   // Gengar
    '130',  // Gyarados
    '143',  // Snorlax
    '131',  // Lapras
    '384',  // Rayquaza
    '483',  // Dialga
    '484',  // Palkia
    '487',  // Giratina
    '644',  // Zekrom
    '643',  // Reshiram
    '716',  // Xerneas
    '717',  // Yveltal
    '800',  // Necrozma
    '887',  // Dragapult
    '1007', // Koraidon
    '1008', // Miraidon
];

function getPokemonFallback(index: number): string {
    const pokemonId = POKEMON_FALLBACKS[index % POKEMON_FALLBACKS.length];
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

// ─── NewsView Component ──────────────────────────
export function NewsView() {
    const { language, t } = useLanguage();
    const [newsData, setNewsData] = useState<NewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [activeTab, setActiveTab] = useState<NewsTab>('vgc');

    // Community Highlight State
    const [highlight, setHighlight] = useState<{ tcg: SavedDeck[], vgc: SavedTeam[] }>({ tcg: [], vgc: [] });
    const [loadingHighlight, setLoadingHighlight] = useState(true);
    const [selectedHighlight, setSelectedHighlight] = useState<{ item: any, type: 'tcg' | 'vgc' } | null>(null);

    useEffect(() => {
        // Fetch metadata for last updated info
        fetch('/data/metadata.json')
            .then(res => res.json())
            .then(data => {
                if (data?.news?.lastUpdated) {
                    setLastUpdated(data.news.lastUpdated);
                }
            })
            .catch(() => { });

        // Fetch News
        fetch('/data/news.json')
            .then(res => res.json())
            .then((data: NewsData) => {
                setNewsData(data);
                setLoading(false);
            })
            .catch(() => {
                setNewsData({ lastUpdated: '', articles: [] });
                setLoading(false);
            });

        // Fetch Community Highlight
        getCommunityHighlight().then(data => {
            setHighlight(data);
            setLoadingHighlight(false);
        }).catch(() => {
            setLoadingHighlight(false);
        });
    }, []);

    // Helper to format relative time
    const getRelativeTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Atualizado agora';
        if (diffHours < 24) return `Atualizado há ${diffHours}h`;
        if (diffDays === 1) return 'Atualizado ontem';
        if (diffDays < 7) return `Atualizado há ${diffDays} dias`;
        return `Atualizado em ${formatDate(dateStr, language)}`;
    };

    // Filter articles by tab
    const filteredArticles = useMemo(() => {
        if (!newsData) return [];
        return newsData.articles.filter(a => a.category === activeTab);
    }, [newsData, activeTab]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-zinc-200 border-t-red-600 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium animate-pulse">{t.loading}</p>
            </div>
        );
    }

    if (!newsData || newsData.articles.length === 0) {
        return (
            <div className="text-center py-20">
                <Newspaper size={48} className="mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-400 text-lg font-medium">{(t as any).noNews || 'No news available yet.'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-6">

            {/* ─── Top Area: Community Highlight ─── */}
            <div className="flex flex-col">
                <div className="bg-zinc-900 rounded-3xl p-1 relative overflow-hidden h-full flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
                    <div className="bg-zinc-950 rounded-[22px] p-6 lg:p-8 relative h-full flex flex-col border border-zinc-800">

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black italic uppercase tracking-tighter text-xl flex items-center gap-2">
                                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                                Destaque da Comunidade
                            </h3>
                            <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800">
                                <Users size={16} className="text-zinc-400" />
                            </div>
                        </div>

                        {loadingHighlight ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10">
                                <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin mb-4" />
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Buscando destaque...</p>
                            </div>
                        ) : (highlight.tcg.length > 0 || highlight.vgc.length > 0) ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">

                                {/* TCG Highlights */}
                                {highlight.tcg.map(deck => (
                                    <div
                                        key={deck.id}
                                        className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 relative overflow-hidden group hover:border-red-500/30 transition-colors cursor-pointer"
                                        onClick={() => setSelectedHighlight({ item: deck, type: 'tcg' })}
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <Sparkles size={64} className="text-white group-hover:text-red-500 transition-colors" />
                                        </div>
                                        <div className="flex gap-4 items-start relative z-10">
                                            {deck.coverCardImg ? (
                                                <div className="w-16 aspect-[245/342] rounded-lg overflow-hidden shrink-0 border border-zinc-800 shadow-xl">
                                                    <img src={deck.coverCardImg} alt={deck.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                            ) : (
                                                <div className="w-16 aspect-[245/342] rounded-lg bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center">
                                                    <Layers className="text-zinc-600" />
                                                </div>
                                            )}
                                            <div className="flex flex-col pt-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1"><Layers size={10} /> Top Deck TCG</span>
                                                    <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Star size={10} className="fill-zinc-500" /> {deck.likesCount || 0}</span>
                                                </div>
                                                <h4 className="text-white font-black italic tracking-tight text-base leading-tight mb-2 line-clamp-2">{deck.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <RankAvatar
                                                        photoURL={deck.userPhotoURL}
                                                        displayName={deck.userName || 'Treinador'}
                                                        contributionCount={(deck as any).contributionCount || 0}
                                                        size="sm"
                                                    />
                                                    <span className="text-zinc-300 font-bold text-xs truncate max-w-[90px]">{deck.userName || 'Treinador'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* VGC Highlights */}
                                {highlight.vgc.map(team => (
                                    <div
                                        key={team.id}
                                        className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 relative overflow-hidden group hover:border-purple-500/30 transition-colors cursor-pointer"
                                        onClick={() => setSelectedHighlight({ item: team, type: 'vgc' })}
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <Swords size={64} className="text-white group-hover:text-purple-500 transition-colors" />
                                        </div>
                                        <div className="flex gap-4 items-start relative z-10">
                                            <div className="grid grid-cols-3 gap-1 w-16 shrink-0">
                                                {team.pokemons?.slice(0, 6).map((p, i) => (
                                                    <div key={i} className="aspect-square rounded bg-zinc-800 border border-zinc-700 overflow-hidden">
                                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} alt={p.name} className="w-full h-full object-contain" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex flex-col pt-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 flex items-center gap-1"><Swords size={10} /> Top Team VGC</span>
                                                    <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Star size={10} className="fill-zinc-500" /> {team.likesCount || 0}</span>
                                                </div>
                                                <h4 className="text-white font-black italic tracking-tight text-base leading-tight mb-2 line-clamp-2">{team.name}</h4>
                                                <div className="flex items-center justify-between mt-auto pt-1">
                                                    <div className="flex items-center gap-2">
                                                        <RankAvatar
                                                            photoURL={team.userPhotoURL}
                                                            displayName={team.userName || 'Treinador'}
                                                            contributionCount={(team as any).contributionCount || 0}
                                                            size="sm"
                                                        />
                                                        <span className="text-zinc-300 font-bold text-xs truncate max-w-[90px]">{team.userName || 'Treinador'}</span>
                                                    </div>
                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest shrink-0">
                                                        {team.pokemons?.length || 0} Pokémon
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                                    <Flame size={24} className="text-zinc-700" />
                                </div>
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-1">Nenhum destaque hoje</p>
                                <p className="text-zinc-600 text-[10px]">Crie um deck ou time público para ser o primeiro!</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ─── Middle Area: Data Radars ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
                <MarketRadar />
                <VgcRadar />
            </div>

            {/* ─── Bottom Area: News Grid ─── */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Newspaper className="text-blue-500" size={24} />
                        <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">
                            Notícias Pokémon
                        </h3>
                    </div>
                    {lastUpdated && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                            <div className={`w-2 h-2 rounded-full ${getRelativeTime(lastUpdated).includes('agora') || (getRelativeTime(lastUpdated).includes('há') && parseInt(getRelativeTime(lastUpdated)) < 24)
                                ? 'bg-green-500'
                                : getRelativeTime(lastUpdated).includes('ontem') || (getRelativeTime(lastUpdated).includes('dias') && parseInt(getRelativeTime(lastUpdated)) < 7)
                                    ? 'bg-yellow-500'
                                    : 'bg-zinc-500'
                                } animate-pulse`} />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                {getRelativeTime(lastUpdated)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['vgc', 'tcg', 'games-anime'] as NewsTab[]).map(tab => {
                        const config = categoryConfig[tab];
                        const Icon = config.icon;
                        const count = newsData?.articles.filter(a => a.category === tab).length || 0;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab
                                    ? `${config.badge} shadow-sm`
                                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                                    }`}
                            >
                                <Icon size={14} />
                                {config.label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/50' : 'bg-zinc-800'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Featured News (First of filtered) */}
                {filteredArticles.length > 0 && (
                    <div className="mb-6">
                        <a
                            href={filteredArticles[0].link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-zinc-900 border-2 border-red-400"
                        >
                            {/* Pokemon Background */}
                            <img
                                src={getPokemonFallback(0)}
                                alt="Pokemon"
                                className="absolute inset-0 w-full h-full object-contain opacity-20 p-12"
                            />

                            {/* Content Container */}
                            <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row gap-6 items-start">
                                {/* Left: Category Badge + Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-white text-red-600 shadow-lg">
                                            {categoryConfig[filteredArticles[0].category].label}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-white/80">
                                            <Clock size={12} />
                                            {formatDate(filteredArticles[0].pubDate, language)}
                                        </span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-4 drop-shadow-lg">
                                        {filteredArticles[0].title}
                                    </h2>
                                    <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3 drop-shadow">
                                        {filteredArticles[0].snippet}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="font-bold uppercase tracking-wider text-white/70">{filteredArticles[0].source}</span>
                                        <span className="flex items-center gap-1 text-red-300 font-black uppercase tracking-widest italic group-hover:gap-2 transition-all">
                                            Ler Mais <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                )}

                {/* News Grid (Remaining articles) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredArticles.slice(1).map((article, i) => {
                        const fallbackPokemon = getPokemonFallback(i + 1);
                        return (
                            <a
                                key={`${article.id}-${i}`}
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-gradient-to-br from-red-500 to-red-700 rounded-2xl border-2 border-red-400 shadow-lg hover:shadow-xl hover:shadow-red-500/20 transition-all overflow-hidden"
                            >
                                {/* Pokemon Background */}
                                <img
                                    src={fallbackPokemon}
                                    alt="Pokemon"
                                    className="absolute inset-0 w-full h-full object-contain opacity-20 p-6"
                                />

                                {/* Content */}
                                <div className="relative p-4 flex flex-col h-[280px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white text-red-600 shadow-sm">
                                            {categoryConfig[article.category].label}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                                            <Clock size={10} />
                                            {formatDate(article.pubDate, language)}
                                        </span>
                                    </div>

                                    <h3 className="font-black text-white text-base leading-snug mb-3 drop-shadow line-clamp-3">
                                        {article.title}
                                    </h3>

                                    <p className="text-sm font-medium text-white/90 leading-relaxed mb-4 line-clamp-2 flex-1 drop-shadow">
                                        {article.snippet}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/20 mt-auto">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70">{article.source}</span>
                                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest italic text-white group-hover:gap-2 transition-all">
                                            Ler <ArrowRight size={10} />
                                        </span>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {filteredArticles.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
                        <Newspaper size={48} className="mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-400 font-medium">Nenhuma notícia nesta categoria</p>
                    </div>
                )}
            </div>

            {/* Render Highlight Modal */}
            <AnimatePresence>
                {selectedHighlight && (
                    <HighlightModal
                        item={selectedHighlight.item}
                        type={selectedHighlight.type}
                        onClose={() => setSelectedHighlight(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default NewsView;
