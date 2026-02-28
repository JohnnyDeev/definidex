import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ExternalLink, Clock, Flame, Trophy, Gamepad2, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Types ───────────────────────────────────────
interface NewsArticle {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    snippet: string;
    source: string;
    category: 'vgc' | 'tcg' | 'general';
}

interface NewsData {
    lastUpdated: string;
    articles: NewsArticle[];
}

type NewsTab = 'all' | 'vgc' | 'tcg' | 'general';

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
    general: {
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
    const [activeTab, setActiveTab] = useState<NewsTab>('all');

    useEffect(() => {
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
    }, []);

    const filteredArticles = useMemo(() => {
        if (!newsData) return [];
        if (activeTab === 'all') return newsData.articles;
        return newsData.articles.filter(a => a.category === activeTab);
    }, [newsData, activeTab]);

    const featuredArticle = newsData?.articles[0] || null;

    const tabs: { id: NewsTab; label: string; icon: React.ElementType }[] = [
        { id: 'all', label: (t as any).allNews || 'All', icon: Newspaper },
        { id: 'vgc', label: 'VGC', icon: Trophy },
        { id: 'tcg', label: 'TCG', icon: Sparkles },
        { id: 'general', label: (t as any).generalNews || 'Games & Anime', icon: Gamepad2 },
    ];

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
        <div className="space-y-8">
            {/* Hero / Featured Article */}
            {featuredArticle && (
                <motion.a
                    href={featuredArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="block group"
                >
                    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${categoryConfig[featuredArticle.category].gradient} p-1`}>
                        <div className="bg-white rounded-[22px] p-6 sm:p-8 relative overflow-hidden">
                            {/* Decorative background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-70" />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${categoryConfig[featuredArticle.category].badge}`}>
                                        {(t as any).featuredNews || '⭐ Featured'}
                                    </span>
                                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${categoryConfig[featuredArticle.category].badge}`}>
                                        {categoryConfig[featuredArticle.category].label || ((t as any).generalNews || 'Games & Anime')}
                                    </span>
                                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(featuredArticle.pubDate, language)}
                                    </span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-3 group-hover:text-red-600 transition-colors leading-tight">
                                    {featuredArticle.title}
                                </h2>

                                <p className="text-zinc-600 text-base sm:text-lg leading-relaxed mb-4 max-w-3xl">
                                    {featuredArticle.snippet}
                                </p>

                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold text-zinc-400">{featuredArticle.source}</span>
                                    <span className="flex items-center gap-1 text-red-600 font-bold text-sm group-hover:gap-2 transition-all">
                                        {(t as any).readMore || 'Read more'} <ExternalLink size={14} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.a>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-white rounded-2xl p-2 shadow-sm border border-zinc-200">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isActive
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {!isActive && (
                                <span className="text-xs bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded-full">
                                    {newsData.articles.filter(a => tab.id === 'all' || a.category === tab.id).length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* News Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {filteredArticles.slice(activeTab === 'all' ? 1 : 0).map((article, i) => (
                        <motion.a
                            key={article.id}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                            className="group block"
                        >
                            <div className={`bg-white rounded-2xl border ${categoryConfig[article.category].border} hover:shadow-lg transition-all h-full flex flex-col overflow-hidden`}>
                                {/* Category Color Bar */}
                                <div className={`h-1.5 bg-gradient-to-r ${categoryConfig[article.category].gradient}`} />

                                <div className="p-5 flex flex-col flex-1">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${categoryConfig[article.category].badge}`}>
                                            {categoryConfig[article.category].label || ((t as any).generalNews || 'Games & Anime')}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatDate(article.pubDate, language)}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-bold text-zinc-900 text-base leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-3">
                                        {article.title}
                                    </h3>

                                    {/* Snippet */}
                                    <p className="text-sm text-zinc-500 leading-relaxed mb-4 flex-1 line-clamp-3">
                                        {article.snippet}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                                        <span className="text-xs font-semibold text-zinc-400">{article.source}</span>
                                        <span className={`flex items-center gap-1 text-xs font-bold ${categoryConfig[article.category].accent} group-hover:gap-1.5 transition-all`}>
                                            {(t as any).readMore || 'Read more'} <ExternalLink size={11} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </motion.div>
            </AnimatePresence>

            {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-zinc-400 text-lg font-medium">{(t as any).noNewsInCategory || 'No articles in this category yet.'}</p>
                </div>
            )}
        </div>
    );
}
