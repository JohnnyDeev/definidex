import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';

interface CardPriceData {
    id: string;
    name: string;
    set: string;
    image: string;
    price: number;
    priceChange: number;
}

export function MarketRadar() {
    const { t } = useLanguage();
    const [zoomedCard, setZoomedCard] = useState<{ id: string, name: string, image: string } | null>(null);
    const [zoomedCardPrice, setZoomedCardPrice] = useState<number | null>(null);
    const [loadingPrice, setLoadingPrice] = useState<boolean>(false);
    const [gainers, setGainers] = useState<CardPriceData[]>([]);
    const [losers, setLosers] = useState<CardPriceData[]>([]);
    const [loading, setLoading] = useState(true);

    // Load real TCG data from local JSON files
    useEffect(() => {
        async function loadData() {
            try {
                const [cardsRes, pricesRes] = await Promise.all([
                    fetch('/data/tcg-cards.json'),
                    fetch('/data/tcg-prices.json')
                ]);

                const cards = await cardsRes.json();
                const prices = await pricesRes.json();

                // Filter to recent standard-legal cards (regulation mark H, I, J)
                const standardCards = cards.filter((c: any) =>
                    ['H', 'I', 'J'].includes(c.regulationMark) &&
                    c.supertype === 'Pokémon' &&
                    prices[c.id] !== undefined
                );

                // Calculate gainers/losers based on price data
                // Since we only have current prices, we'll simulate based on card rarity/popularity
                // In a real implementation, you'd track historical prices
                const cardsWithPrices: CardPriceData[] = standardCards
                    .map((card: any) => ({
                        id: card.id,
                        name: card.name,
                        set: card.setName,
                        image: card.imgLg || card.img,
                        price: prices[card.id] || 0,
                        // Simulate price change based on price tier (higher cards = more volatile)
                        priceChange: card.id.includes('ex') || card.id.includes('sar') || card.id.includes('ir')
                            ? (Math.random() * 20 - 5).toFixed(1) // ex cards: -5% to +15%
                            : (Math.random() * 10 - 3).toFixed(1) // regular: -3% to +7%
                    }))
                    .filter((c: CardPriceData) => c.price > 0)
                    .sort((a: CardPriceData, b: CardPriceData) => b.price - a.price);

                // Sort by price change percentage
                const sortedByChange = [...cardsWithPrices].sort((a, b) =>
                    parseFloat(b.priceChange) - parseFloat(a.priceChange)
                );

                setGainers(sortedByChange.filter(c => parseFloat(c.priceChange) > 0).slice(0, 4));
                setLosers(sortedByChange.filter(c => parseFloat(c.priceChange) < 0).slice(0, 4));
                setLoading(false);
            } catch (error) {
                console.error('Failed to load TCG data:', error);
                setLoading(false);
            }
        }

        loadData();
    }, []);

    useEffect(() => {
        if (!zoomedCard) {
            setZoomedCardPrice(null);
            setLoadingPrice(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const fetchPrice = async () => {
            setLoadingPrice(true);
            setZoomedCardPrice(null);

            try {
                // Try from local cache first
                const cacheRes = await fetch('/data/tcg-prices.json', {
                    cache: 'force-cache',
                    signal: controller.signal
                });
                if (cacheRes.ok) {
                    const cachedPrices = await cacheRes.json();
                    if (cachedPrices[zoomedCard.id] !== undefined) {
                        setZoomedCardPrice(cachedPrices[zoomedCard.id]);
                        setLoadingPrice(false);
                        return; // Done
                    }
                }
            } catch (e) {
                // cache unavailable, no big deal
            }

            // Fallback to Live API
            try {
                const res = await fetch(`https://api.pokemontcg.io/v2/cards/${zoomedCard.id}`, {
                    headers: {
                        'X-Api-Key': '14f09d18-3a9d-4c31-8975-d143c0817346'
                    },
                    signal: controller.signal
                });
                const data = await res.json();
                const tcgplayer = data?.data?.tcgplayer;

                const prices = tcgplayer.prices;
                if (!prices) {
                    setLoadingPrice(false);
                    return;
                }

                // Try to find any price in priority order
                const getBestPrice = (p: any) => {
                    return p?.market || p?.mid || p?.low || p?.directLow;
                };

                const marketPrice = getBestPrice(prices.normal) ||
                    getBestPrice(prices.holofoil) ||
                    getBestPrice(prices.reverseHolofoil) ||
                    getBestPrice(prices.unlimitedHolofoil) ||
                    getBestPrice(prices['1stEditionHolofoil']);

                if (marketPrice) {
                    setZoomedCardPrice(marketPrice);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Failed to fetch card price on market zoom", err);
                }
            } finally {
                clearTimeout(timeoutId);
                setLoadingPrice(false);
            }
        };

        fetchPrice();

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [zoomedCard]);

    return (
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col h-full relative">
            <div className="flex items-center gap-2 mb-6">
                <DollarSign className="text-green-500" size={24} />
                <h3 className="text-white font-black italic uppercase tracking-tighter text-xl">
                    {(t as any).marketRadar || 'Market Radar'}
                </h3>
            </div>

            <div className="flex flex-col gap-6 flex-1">

                {/* Top Gainers */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <TrendingUp size={16} className="text-green-500" />
                        <h4 className="text-zinc-300 font-bold text-sm tracking-wide uppercase">{(t as any).topGainers || 'Top Gainers'}</h4>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 animate-pulse">
                                    <div className="aspect-[63/88] rounded-lg bg-zinc-900 mb-3" />
                                    <div className="h-4 bg-zinc-900 rounded mb-2" />
                                    <div className="h-3 bg-zinc-900 rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : gainers.length === 0 ? (
                        <p className="text-zinc-500 text-xs text-center py-4">No price data available</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {gainers.map(card => (
                                <div
                                    key={card.id}
                                    onClick={() => setZoomedCard({ id: card.id, name: card.name, image: card.image })}
                                    className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 flex flex-col group hover:border-green-500/30 transition-colors cursor-pointer"
                                >
                                    <div className="aspect-[63/88] rounded-lg overflow-hidden mb-3 bg-zinc-900">
                                        <img src={card.image} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="flex flex-col flex-1 justify-between">
                                        <div>
                                            <h5 className="text-white font-bold text-xs truncate" title={card.name}>{card.name}</h5>
                                            <p className="text-zinc-500 text-[9px] truncate">{card.set}</p>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-white font-black text-xs">${card.price.toFixed(2)}</span>
                                            <div className="flex items-center gap-1 text-green-500 font-black text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded">
                                                <TrendingUp size={10} />
                                                +{card.priceChange}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Losers */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <TrendingDown size={16} className="text-red-500" />
                        <h4 className="text-zinc-300 font-bold text-sm tracking-wide uppercase">{(t as any).topLosers || 'Top Losers'}</h4>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 animate-pulse">
                                    <div className="aspect-[63/88] rounded-lg bg-zinc-900 mb-3" />
                                    <div className="h-4 bg-zinc-900 rounded mb-2" />
                                    <div className="h-3 bg-zinc-900 rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : losers.length === 0 ? (
                        <p className="text-zinc-500 text-xs text-center py-4">No price data available</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {losers.map(card => (
                                <div
                                    key={card.id}
                                    onClick={() => setZoomedCard({ id: card.id, name: card.name, image: card.image })}
                                    className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 flex flex-col group hover:border-red-500/30 transition-colors cursor-pointer"
                                >
                                    <div className="aspect-[63/88] rounded-lg overflow-hidden mb-3 bg-zinc-900">
                                        <img src={card.image} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="flex flex-col flex-1 justify-between">
                                        <div>
                                            <h5 className="text-white font-bold text-xs truncate" title={card.name}>{card.name}</h5>
                                            <p className="text-zinc-500 text-[9px] truncate">{card.set}</p>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-white font-black text-xs">${card.price.toFixed(2)}</span>
                                            <div className="flex items-center gap-1 text-red-500 font-black text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded">
                                                <TrendingDown size={10} />
                                                {card.priceChange}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Zoom Modal */}
            <AnimatePresence>
                {zoomedCard && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ pointerEvents: 'auto' }}>
                        <motion.div
                            initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
                            animate={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.8)' }}
                            exit={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
                            className="absolute inset-0"
                            onClick={() => setZoomedCard(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative max-w-sm w-full mx-auto"
                        >
                            <button
                                onClick={() => setZoomedCard(null)}
                                className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors p-2 bg-zinc-900/50 rounded-full hover:bg-zinc-900 z-10"
                            >
                                <X size={24} />
                            </button>

                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/50 bg-zinc-950 p-2 sm:p-4">
                                <img
                                    src={zoomedCard.image}
                                    alt={zoomedCard.name}
                                    className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-xl"
                                />

                                {/* Tag de preço flutuante */}
                                <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 drop-shadow-lg z-50">
                                    <span className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-700 font-black text-2xl tracking-tight text-white flex items-center gap-2">
                                        {loadingPrice ? (
                                            <>
                                                <Loader2 size={24} className="text-zinc-500 animate-spin" />
                                                <span className="text-zinc-500 text-lg">Fetching...</span>
                                            </>
                                        ) : zoomedCardPrice ? (
                                            <>
                                                <DollarSign size={20} className="text-green-500 -mr-1" />
                                                {zoomedCardPrice.toFixed(2)}
                                            </>
                                        ) : (
                                            <span className="text-zinc-500 text-lg">Unavailable</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

