import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, Flame, Trophy, Gamepad2, Sparkles, Star, Users, ArrowRight, Layers, Swords, Shield } from 'lucide-react';
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
        icon: Trophy,
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
        label: 'Games & Anime',
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
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

// ─── NewsView Component ──────────────────────────
export function NewsView() {
    const { language, t } = useLanguage();
    const [newsData, setNewsData] = useState<NewsData | null>(null);
    const [loading, setLoading] = useState(true);

    // Community Highlight State
    const [highlight, setHighlight] = useState<{ tcg: SavedDeck[], vgc: SavedTeam[] }>({ tcg: [], vgc: [] });
    const [loadingHighlight, setLoadingHighlight] = useState(true);
    const [selectedHighlight, setSelectedHighlight] = useState<{ item: any, type: 'tcg' | 'vgc' } | null>(null);

    useEffect(() => {
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

        // Fetch Community Highlight (non-blocking for news)
        getCommunityHighlight().then(data => {
            console.log('[Diagnostic] Community Highlight loaded:', {
                tcgCount: data.tcg.length,
                vgcCount: data.vgc.length
            });
            setHighlight(data);
            setLoadingHighlight(false);
        }).catch(() => {
            setLoadingHighlight(false);
        });
    }, []);

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
                <p className="text-zinc-400 text-sm mt-2">{(t as any).noNewsDesc || 'News will be fetched automatically. Check back soon!'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-6">

            {/* ─── Top Area: Featured News & Community Highlight ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Top: Community Spotlight (Replaces News Banner) */}
                <div className="xl:col-span-3 flex flex-col">
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
                                                        <Newspaper className="text-zinc-600" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col pt-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1"><Layers size={10} /> Top Deck TCG</span>
                                                        <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Star size={10} className="fill-zinc-500" /> {deck.likesCount || 0}</span>
                                                    </div>
                                                    <h4 className="text-white font-black italic tracking-tight text-base leading-tight mb-2 line-clamp-2">{deck.name}</h4>
                                                    <div className="flex items-center justify-between mt-auto pt-1">
                                                        <div className="flex items-center gap-2">
                                                            <RankAvatar
                                                                photoURL={deck.userPhotoURL}
                                                                displayName={deck.userName || 'Treinador'}
                                                                contributionCount={(deck as any).contributionCount || 0}
                                                                size="sm"
                                                            />
                                                            <span className="text-zinc-300 font-bold text-xs truncate max-w-[90px]">{deck.userName || 'Treinador'}</span>
                                                        </div>
                                                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest shrink-0">
                                                            {countDeckCards(deck.cards)} {t.cards}
                                                        </p>
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
                                            <div className="flex gap-4 items-center relative z-10">
                                                <div className="w-16 aspect-square rounded-full bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center shadow-inner overflow-hidden">
                                                    <Shield className="text-purple-500" size={24} />
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
            </div>

            {/* ─── Middle Area: Data Radars ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
                <MarketRadar />
                <VgcRadar />
            </div>

            {/* ─── Bottom Area: General News Carousel ─── */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-6">
                    <Newspaper className="text-blue-500" size={24} />
                    <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">
                        {(t as any).generalNewsTitle || 'Notícias Gerais do Mundo Pokémon'}
                    </h3>
                </div>

                {/* News Carousel */}
                <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 -mx-2 custom-scrollbar snap-x">
                    {newsData.articles
                        .map((article, i) => (
                            <a
                                key={`${article.id}-${i}`}
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block min-w-[300px] sm:min-w-[340px] max-w-[340px] snap-start transition-all hover:-translate-y-1"
                            >
                                <div className={`bg-white rounded-[2rem] border-2 border-transparent hover:${categoryConfig[article.category].border} shadow-sm hover:shadow-xl hover:shadow-${categoryConfig[article.category].accent}/10 transition-all h-full flex flex-col overflow-hidden`}>

                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <div />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatDate(article.pubDate, language)}
                                            </span>
                                        </div>

                                        <h3 className="font-black text-zinc-800 text-lg leading-tight mb-3 group-hover:text-red-600 transition-colors line-clamp-3">
                                            {article.title}
                                        </h3>

                                        <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-6 flex-1 line-clamp-3">
                                            {article.snippet}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 bg-zinc-50 px-2 py-1 rounded-md">{article.source}</span>
                                            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest italic ${categoryConfig[article.category].accent} group-hover:gap-2 transition-all`}>
                                                {(t as any).readMore || 'Ler Mais'} <ArrowRight size={12} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}

                    {newsData && newsData.articles.length === 0 && (
                        <div className="w-full text-center py-20 bg-white rounded-[2rem] border border-zinc-100 border-dashed">
                            <p className="text-zinc-400 text-sm font-black uppercase tracking-widest italic">{(t as any).noNewsAvailable || 'Ainda sem notícias disponíveis.'}</p>
                        </div>
                    )}
                </div>
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
