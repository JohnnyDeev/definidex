import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, ChevronDown, X, Image, FileText, AlertTriangle, Shield, Loader2, Save, Globe, Lock, Check } from 'lucide-react';
import { fetchSets, searchCards, loadAllCards, isBasicEnergy, isCardValidForFormat, type TcgCard, type TcgSet, type TcgFormat } from '../hooks/tcgApi';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { saveDeck, deleteDeck, subscribeToUserDecks, type SavedDeck } from '../lib/firestoreUtils';
import { AuthModal } from './AuthModal';
import { SocialFeed } from './SocialFeed';

// ─── Deck Entry ──────────────────────────────────
interface DeckEntry {
    card: TcgCard;
    quantity: number;
}

// ─── Constants ───────────────────────────────────
const MAX_DECK_SIZE = 60;
const MAX_COPIES = 4;

// ─── Component ───────────────────────────────────
interface TcgDeckBuilderProps {
    onNavigateToProfile?: (uid: string) => void;
}

export function TcgDeckBuilder({ onNavigateToProfile }: TcgDeckBuilderProps) {
    const { t } = useLanguage();
    const { user, profile, setShowAuthModal } = useAuth();

    // Data loading
    const [sets, setSets] = useState<TcgSet[]>([]);
    const [dataReady, setDataReady] = useState(false);

    // Gallery state
    const [selectedSet, setSelectedSet] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [galleryCards, setGalleryCards] = useState<TcgCard[]>([]);
    const [galleryTotal, setGalleryTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Deck state
    const [deck, setDeck] = useState<DeckEntry[]>([]);
    const [format, setFormat] = useState<TcgFormat>('standard');
    const [showDeckPanel, setShowDeckPanel] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [formatWarning, setFormatWarning] = useState('');

    // Zoom
    const [zoomedCard, setZoomedCard] = useState<TcgCard | null>(null);
    const [zoomedCardPrice, setZoomedCardPrice] = useState<{ usd?: number; lastUpdated?: string } | null>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch Card Price Live when Zoomed
    useEffect(() => {
        if (!zoomedCard) {
            setZoomedCardPrice(null);
            setLoadingPrice(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const getPrice = async () => {
            setLoadingPrice(true);
            try {
                // Try from local cache first
                const cacheRes = await fetch('/data/tcg-prices.json', {
                    cache: 'force-cache',
                    signal: controller.signal
                });
                if (cacheRes.ok) {
                    const cachedPrices = await cacheRes.json();
                    if (cachedPrices[zoomedCard.id] !== undefined) {
                        setZoomedCardPrice({ usd: cachedPrices[zoomedCard.id], lastUpdated: 'Cached' });
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
                    headers: { 'X-Api-Key': '14f09d18-3a9d-4c31-8975-d143c0817346' },
                    signal: controller.signal
                });
                const data = await res.json();
                const cardData = data.data;
                const prices = cardData?.tcgplayer?.prices;
                if (!prices) {
                    setZoomedCardPrice({ usd: 0 });
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
                    setZoomedCardPrice({ usd: marketPrice, lastUpdated: cardData.tcgplayer?.updatedAt });
                } else {
                    setZoomedCardPrice({ usd: 0 }); // price unavailable
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Error fetching card price:", err);
                }
                setZoomedCardPrice(null);
            } finally {
                clearTimeout(timeoutId);
                setLoadingPrice(false);
            }
        };

        getPrice();

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [zoomedCard]);

    // Save Modal
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [deckName, setDeckName] = useState('');
    const [coverCard, setCoverCard] = useState<TcgCard | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Saved Decks Management
    const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
    const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
    const [loadingDecks, setLoadingDecks] = useState(false);

    // ─── Load Data on Mount ───────────────────────
    useEffect(() => {
        Promise.all([fetchSets(), loadAllCards()])
            .then(([setsData]) => {
                setSets(setsData);
                setDataReady(true);
            })
            .catch(err => console.error('Data load error:', err));
    }, []);

    useEffect(() => {
        if (!user) {
            setSavedDecks([]);
            setEditingDeckId(null);
            setLoadingDecks(false);
            return;
        }

        setLoadingDecks(true);
        const unsubscribe = subscribeToUserDecks(user.uid, (updatedDecks) => {
            setSavedDecks(updatedDecks);
            setLoadingDecks(false);
        });

        return () => unsubscribe();
    }, [user]);

    // loadDecks is now handled by the subscription
    const loadDecks = () => {
        console.log('Real-time subscription is active for decks. Manual reload skipped.');
    };

    // ─── Debounce search ──────────────────────────
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 200);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery]);

    // ─── Search when query/set changes ────────────
    useEffect(() => {
        if (!dataReady) return;
        setPage(1);
        searchCards(debouncedQuery, selectedSet || undefined, 1, 30)
            .then(result => {
                setGalleryCards(result.cards);
                setGalleryTotal(result.totalCount);
            });
    }, [debouncedQuery, selectedSet, dataReady]);

    // ─── Load More ────────────────────────────────
    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        searchCards(debouncedQuery, selectedSet || undefined, nextPage, 30)
            .then(result => {
                setGalleryCards(prev => [...prev, ...result.cards]);
            });
    };

    // ─── Deck Helpers ──────────────────────────────
    const deckCount = useMemo(() => deck.reduce((sum, e) => sum + e.quantity, 0), [deck]);

    const getCardCount = (cardName: string) =>
        deck.filter(e => e.card.name === cardName).reduce((sum, e) => sum + e.quantity, 0);

    const canAddCard = (card: TcgCard): { ok: boolean; reason?: string } => {
        if (deckCount >= MAX_DECK_SIZE) return { ok: false, reason: (t as any).deckFull || 'Deck is full!' };
        if (!isBasicEnergy(card) && getCardCount(card.name) >= MAX_COPIES) {
            return { ok: false, reason: `Max ${MAX_COPIES} copies of ${card.name}` };
        }
        if (!isCardValidForFormat(card, format)) {
            return {
                ok: false, reason: format === 'standard'
                    ? `${card.name} — not Standard legal (needs mark F/G/H/I)`
                    : `${card.name} — not Expanded legal`
            };
        }
        return { ok: true };
    };

    const addCard = (card: TcgCard) => {
        const check = canAddCard(card);
        if (!check.ok) {
            setFormatWarning(check.reason || '');
            setTimeout(() => setFormatWarning(''), 3000);
            return;
        }
        setDeck(prev => {
            const existing = prev.find(e => e.card.id === card.id);
            if (existing) return prev.map(e => e.card.id === card.id ? { ...e, quantity: e.quantity + 1 } : e);
            return [...prev, { card, quantity: 1 }];
        });
    };

    const removeCard = (cardId: string) => {
        setDeck(prev => {
            const entry = prev.find(e => e.card.id === cardId);
            if (!entry) return prev;
            if (entry.quantity <= 1) return prev.filter(e => e.card.id !== cardId);
            return prev.map(e => e.card.id === cardId ? { ...e, quantity: e.quantity - 1 } : e);
        });
    };

    const removeAllOfCard = (cardId: string) => {
        setDeck(prev => prev.filter(e => e.card.id !== cardId));
    };

    // ─── Categorized Deck ──────────────────────────
    const categorizedDeck = useMemo(() => ({
        pokemon: deck.filter(e => e.card.supertype === 'Pokémon'),
        trainers: deck.filter(e => e.card.supertype === 'Trainer'),
        energy: deck.filter(e => e.card.supertype === 'Energy'),
    }), [deck]);

    const pokemonCount = categorizedDeck.pokemon.reduce((s, e) => s + e.quantity, 0);
    const trainerCount = categorizedDeck.trainers.reduce((s, e) => s + e.quantity, 0);
    const energyCount = categorizedDeck.energy.reduce((s, e) => s + e.quantity, 0);

    // ─── Export Text ───────────────────────────────
    const exportText = () => {
        const fmtEntry = (e: DeckEntry) => `${e.quantity} ${e.card.name} ${e.card.set.toUpperCase()} ${e.card.number}`;
        let text = '';
        if (categorizedDeck.pokemon.length > 0) {
            text += `Pokémon: ${pokemonCount}\n${categorizedDeck.pokemon.map(fmtEntry).join('\n')}\n\n`;
        }
        if (categorizedDeck.trainers.length > 0) {
            text += `Trainer: ${trainerCount}\n${categorizedDeck.trainers.map(fmtEntry).join('\n')}\n\n`;
        }
        if (categorizedDeck.energy.length > 0) {
            text += `Energy: ${energyCount}\n${categorizedDeck.energy.map(fmtEntry).join('\n')}\n`;
        }
        navigator.clipboard.writeText(text.trim()).then(() => {
            alert((t as any).copySuccess || 'Copied to clipboard!');
        });
    };

    // ─── Deck Sheet Generator ─────────────────────
    const generateDeckSheet = async () => {
        if (deck.length === 0) return;
        setGenerating(true);
        try {
            const COLS = 5;
            const CARD_W = 245, CARD_H = 342, GAP = 12, PADDING = 30, FOOTER_H = 60;
            const rows = Math.ceil(deck.length / COLS);
            const canvasW = PADDING * 2 + COLS * CARD_W + (COLS - 1) * GAP;
            const canvasH = PADDING * 2 + rows * CARD_H + (rows - 1) * GAP + FOOTER_H;
            const canvas = document.createElement('canvas');
            canvas.width = canvasW; canvas.height = canvasH;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvasW, canvasH);

            const loadImg = (url: string) => new Promise<HTMLImageElement>((res, rej) => {
                const img = new window.Image(); img.crossOrigin = 'anonymous';
                img.onload = () => res(img); img.onerror = rej; img.src = url;
            });

            for (let i = 0; i < deck.length; i++) {
                const entry = deck[i];
                const col = i % COLS, row = Math.floor(i / COLS);
                const x = PADDING + col * (CARD_W + GAP), y = PADDING + row * (CARD_H + GAP);
                try {
                    const img = await loadImg(entry.card.imgLg || entry.card.img);
                    ctx.drawImage(img, x, y, CARD_W, CARD_H);
                } catch {
                    ctx.fillStyle = '#1f2937'; ctx.fillRect(x, y, CARD_W, CARD_H);
                    ctx.fillStyle = '#9ca3af'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(entry.card.name, x + CARD_W / 2, y + CARD_H / 2);
                }
                if (entry.quantity > 1) {
                    const bs = 36, bx = x + CARD_W - bs - 6, by = y + 6;
                    ctx.fillStyle = 'rgba(220,38,38,0.95)'; ctx.beginPath(); ctx.roundRect(bx, by, bs, bs, 8); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(`×${entry.quantity}`, bx + bs / 2, by + bs / 2);
                }
            }
            const fy = canvasH - FOOTER_H;
            ctx.fillStyle = '#1f2937'; ctx.fillRect(0, fy, canvasW, FOOTER_H);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('DefiniDEX', PADDING, fy + FOOTER_H / 2);
            ctx.fillStyle = '#9ca3af'; ctx.font = '14px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText(`${deckCount} cards • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, canvasW - PADDING, fy + FOOTER_H / 2);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                if (navigator.share && navigator.canShare) {
                    try {
                        await navigator.share({ title: 'DefiniDEX Deck', files: [new File([blob], 'definidex-deck.png', { type: 'image/png' })] });
                        setGenerating(false); return;
                    } catch { /* cancelled */ }
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'definidex-deck.png'; a.click();
                URL.revokeObjectURL(url); setGenerating(false);
            }, 'image/png');
        } catch { setGenerating(false); }
    };

    // ─── Save Deck ────────────────────────────────
    const handleSaveDeck = async () => {
        if (!user || deck.length === 0 || !deckName) {
            console.warn('Save attempt blocked:', { hasUser: !!user, deckSize: deck.length, hasName: !!deckName });
            return;
        }

        setSaving(true);
        console.log('Initiating deck save...', { uid: user.uid, deckName });

        try {
            // If no cover card selected, use the first Pokemon
            const finalCover = coverCard || categorizedDeck.pokemon[0]?.card || deck[0].card;
            console.log('Chosen cover card:', finalCover?.name);

            const deckToSave = {
                name: deckName,
                cards: deck.map(e => ({ id: e.card.id, quantity: e.quantity, card: e.card })),
                coverCardId: finalCover.id,
                coverCardImg: finalCover.img,
                isPublic
            };

            const deckId = await saveDeck(
                user.uid,
                deckToSave,
                editingDeckId || undefined,
                profile?.displayName || user.displayName || user.email?.split('@')[0],
                profile?.photoURL || user.photoURL || undefined
            );
            console.log('Deck saved successfully. Doc ID:', deckId);

            setEditingDeckId(deckId);

            setSaveSuccess(true);
            // No manual refresh needed
            setTimeout(() => {
                setSaveSuccess(false);
                setShowSaveModal(false);
            }, 2000);
        } catch (error: any) {
            console.error('Error saving deck:', error);
            alert(`Erro ao salvar deck: ${error.message || 'Tente novamente.'}`);
        } finally {
            setSaving(false);
        }
    };

    const loadDeck = (savedDeck: SavedDeck) => {
        setDeck(savedDeck.cards.map(c => ({ card: c.card, quantity: c.quantity })));
        setDeckName(savedDeck.name);
        setIsPublic(savedDeck.isPublic);
        if (savedDeck.coverCardId) {
            const cover = savedDeck.cards.find(c => c.card.id === savedDeck.coverCardId)?.card;
            if (cover) setCoverCard(cover);
        }
        setEditingDeckId(savedDeck.id || null);
    };

    const handleNewDeck = () => {
        setDeck([]);
        setDeckName('');
        setCoverCard(null);
        setIsPublic(true);
        setEditingDeckId(null);
    };

    const handleDeleteDeck = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este deck?')) return;
        try {
            await deleteDeck(id);
            // No manual refresh needed
            if (editingDeckId === id) handleNewDeck();
        } catch (err) {
            console.error("Error deleting deck:", err);
            alert("Erro ao excluir o deck.");
        }
    };

    // ─── Loading Screen ────────────────────────────
    if (!dataReady) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
                <p className="text-zinc-500 font-semibold text-sm">Loading card database (20,000+ cards)...</p>
            </div>
        );
    }

    // ─── Render ────────────────────────────────────
    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* ─── Main Builder Area ─── */}
            <div className="flex-1 min-w-0 order-2 lg:order-1">
                {/* Top Stats Bar */}
                <div className="bg-white rounded-[2rem] p-4 sm:p-6 mb-6 shadow-sm border border-zinc-100 flex flex-wrap items-center gap-4 sm:gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-red-600 rounded-full" />
                        <div>
                            <h2 className="text-lg font-bold text-zinc-800">Gallery de Cartas</h2>
                            <p className="text-xs text-zinc-400">Explore e adicione cartas ao seu deck</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Search Controls */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={(t as any).searchCards || 'Search cards by name...'}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-sm font-medium"
                                />
                            </div>
                            <div className="relative sm:w-72">
                                <select
                                    value={selectedSet}
                                    onChange={e => setSelectedSet(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 outline-none appearance-none font-semibold text-zinc-700 text-sm cursor-pointer pr-10"
                                >
                                    <option value="">{(t as any).allSets || 'All Sets'}</option>
                                    {sets.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.series})</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        {galleryTotal > 0 && (
                            <p className="text-xs text-zinc-400">
                                {galleryCards.length} / {galleryTotal} cards
                            </p>
                        )}
                    </div>

                    {/* Format Warning */}
                    <AnimatePresence>
                        {formatWarning && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-800 text-sm font-medium"
                            >
                                <AlertTriangle size={16} className="shrink-0" />
                                {formatWarning}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Card Grid */}
                    {galleryCards.length === 0 ? (
                        <div className="text-center py-16">
                            <Search size={48} className="mx-auto text-zinc-300 mb-4" />
                            <p className="text-zinc-400 font-medium">{(t as any).noCardsFound || 'No cards found.'}</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                                {galleryCards.map((card) => {
                                    const inDeck = deck.find(e => e.card.id === card.id);
                                    const check = canAddCard(card);
                                    return (
                                        <motion.div
                                            key={card.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative group"
                                        >
                                            <div
                                                className="cursor-pointer rounded-xl overflow-hidden border-2 border-zinc-200 hover:border-red-400 transition-colors shadow-sm hover:shadow-lg bg-zinc-100"
                                                onClick={() => setZoomedCard(card)}
                                            >
                                                <img src={card.img} alt={card.name} className="w-full aspect-[245/342] object-cover" loading="lazy" />
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addCard(card); }}
                                                className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${check.ok ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-110' : 'bg-zinc-400 text-zinc-200 hover:bg-amber-500 hover:text-white'
                                                    }`}
                                                title={check.reason || 'Add to deck'}
                                            >
                                                <Plus size={18} strokeWidth={3} />
                                            </button>
                                            {inDeck && (
                                                <div className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                                                    {inDeck.quantity}
                                                </div>
                                            )}
                                            {card.regulationMark && (
                                                <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                    {card.regulationMark}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {galleryCards.length < galleryTotal && (
                                <div className="flex justify-center mt-6">
                                    <button
                                        onClick={loadMore}
                                        className="bg-white border-2 border-zinc-200 text-zinc-700 hover:border-red-500 hover:text-red-600 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm"
                                    >
                                        {(t as any).loadMore || 'Load More'} ({galleryCards.length}/{galleryTotal})
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Sidebar (appears before gallery on mobile, sidebar on desktop) */}
            <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-6 order-1 lg:order-2">
                {/* ─── My Decks Panel ─── */}
                {user && (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                                <FileText size={16} className="text-red-500" />
                                Meus Decks
                            </h3>
                        </div>
                        {loadingDecks ? (
                            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-red-500" /></div>
                        ) : savedDecks.length === 0 ? (
                            <p className="text-xs text-zinc-400 text-center py-2">Nenhum deck salvo.</p>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                                {savedDecks.map(d => (
                                    <div key={d.id} className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${editingDeckId === d.id ? 'bg-red-50 border-red-200 text-red-700' : 'bg-zinc-50 border-transparent text-zinc-600 hover:bg-zinc-100'}`} onClick={() => loadDeck(d)}>
                                        <div className="flex items-center gap-2 truncate">
                                            {d.isPublic ? <Globe size={12} className="shrink-0 text-zinc-400" /> : <Lock size={12} className="shrink-0 text-zinc-400" />}
                                            <span className="truncate">{d.name}</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); d.id && handleDeleteDeck(d.id); }} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Builder Control Panel ─── */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden border-t-4 border-t-red-600">
                    <div className="p-4 bg-zinc-50 border-b border-zinc-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg text-zinc-800 tracking-tight italic">BUILDER</h3>
                            <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded-lg ${deckCount > MAX_DECK_SIZE ? 'bg-yellow-400 text-yellow-900 shadow-sm shadow-yellow-400/20' : 'bg-zinc-200 text-zinc-600'}`}>
                                {deckCount}/{MAX_DECK_SIZE}
                            </span>
                        </div>
                        <div className="h-2.5 bg-zinc-200 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-300 ${deckCount > MAX_DECK_SIZE ? 'bg-yellow-400' : 'bg-red-600'}`}
                                style={{ width: `${Math.min((deckCount / MAX_DECK_SIZE) * 100, 100)}%` }}
                            />
                        </div>

                        {/* Format Toggle */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => setFormat('standard')}
                                className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-2 ${format === 'standard' ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20' : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}>
                                Standard
                            </button>
                            <button onClick={() => setFormat('expanded')}
                                className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-2 ${format === 'expanded' ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}>
                                Expanded
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[40vh] lg:max-h-[50vh] overflow-y-auto p-3 space-y-4">
                        {deck.length === 0 ? (
                            <div className="text-center py-10">
                                <Plus size={32} className="mx-auto text-zinc-200 mb-2" />
                                <p className="text-zinc-400 text-xs font-bold uppercase tracking-tight italic">{(t as any).emptyDeck || 'Deck Vazio'}</p>
                            </div>
                        ) : (
                            <>
                                {categorizedDeck.pokemon.length > 0 && <DeckCategory title={`Pokémon (${pokemonCount})`} color="bg-blue-500" entries={categorizedDeck.pokemon} onAdd={addCard} onRemove={removeCard} onRemoveAll={removeAllOfCard} canAdd={canAddCard} />}
                                {categorizedDeck.trainers.length > 0 && <DeckCategory title={`Trainers (${trainerCount})`} color="bg-amber-500" entries={categorizedDeck.trainers} onAdd={addCard} onRemove={removeCard} onRemoveAll={removeAllOfCard} canAdd={canAddCard} />}
                                {categorizedDeck.energy.length > 0 && <DeckCategory title={`Energy (${energyCount})`} color="bg-green-500" entries={categorizedDeck.energy} onAdd={addCard} onRemove={removeCard} onRemoveAll={removeAllOfCard} canAdd={canAddCard} />}
                            </>
                        )}
                    </div>

                    {deck.length > 0 && (
                        <div className="p-4 bg-zinc-50 border-t border-zinc-200 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={exportText}
                                    className="flex items-center justify-center gap-2 py-2.5 bg-zinc-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-black transition-colors">
                                    <FileText size={14} /> Exportar
                                </button>
                                <button onClick={generateDeckSheet} disabled={generating}
                                    className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50">
                                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
                                    Imagem
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    if (user) {
                                        setShowSaveModal(true);
                                    } else {
                                        setShowAuthModal(true);
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95"
                            >
                                <Save size={16} /> Salvar no Perfil
                            </button>

                            <button onClick={() => setDeck([])}
                                className="w-full flex items-center justify-center gap-1 py-1 text-zinc-400 hover:text-red-500 transition-colors text-[9px] font-black uppercase tracking-tighter">
                                <Trash2 size={10} /> {(t as any).clearDeck || 'Limpar Tudo'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Social Feed - Always visible in its own block */}
                <SocialFeed
                    type="tcg"
                    onNavigateToProfile={onNavigateToProfile || (() => { })}
                    onImportSuccess={loadDecks}
                />
            </div>

            {/* ─── Card Zoom Modal ─── */}
            <AnimatePresence>
                {zoomedCard && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomedCard(null)}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            onClick={e => e.stopPropagation()} className="relative max-w-sm w-full">
                            <img src={zoomedCard.imgLg || zoomedCard.img} alt={zoomedCard.name} className="w-full rounded-2xl shadow-2xl" />
                            <button onClick={() => setZoomedCard(null)} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
                                <X size={20} />
                            </button>

                            {/* Price Badge */}
                            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-green-400 px-3 py-1.5 rounded-full font-bold shadow-lg border border-green-500/30 flex items-center gap-2">
                                {loadingPrice ? (
                                    <><Loader2 size={16} className="animate-spin text-green-400" /> <span className="text-sm">Buscando preço...</span></>
                                ) : zoomedCardPrice?.usd ? (
                                    <span className="text-sm tracking-wide font-black">${zoomedCardPrice.usd.toFixed(2)} USD</span>
                                ) : (
                                    <span className="text-sm text-zinc-400">Preço indisponível</span>
                                )}
                            </div>
                            <button onClick={() => addCard(zoomedCard)}
                                className={`absolute bottom-4 right-4 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 ${canAddCard(zoomedCard).ok ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-500 text-zinc-300'
                                    }`}>
                                <Plus size={16} strokeWidth={3} /> {(t as any).addToDeck || 'Add to Deck'}
                            </button>
                            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm">
                                {zoomedCard.setName} • #{zoomedCard.number}
                                {zoomedCard.regulationMark && <span className="ml-1 text-yellow-300">({zoomedCard.regulationMark})</span>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Save Modal ─── */}
            <AnimatePresence>
                {showSaveModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center">
                                <Save size={40} className="mx-auto mb-3" />
                                <h3 className="text-xl font-black italic uppercase tracking-tight">Salvar Deck</h3>
                                <p className="text-green-100 text-xs font-bold mt-1">Dê um nome e mostre sua estratégia</p>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Nome do Deck</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={deckName}
                                        onChange={e => setDeckName(e.target.value)}
                                        placeholder="Ex: Turbo Gholdengo, Gardevoir Ex..."
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-100 bg-zinc-50 focus:border-green-500 focus:bg-white outline-none transition-all font-bold text-zinc-800"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Capa do Deck</label>
                                    <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto p-1 bg-zinc-50 rounded-2xl border border-zinc-100">
                                        {deck.map(e => (
                                            <button
                                                key={`cover-${e.card.id}`}
                                                onClick={() => setCoverCard(e.card)}
                                                className={`relative aspect-[245/342] rounded-lg overflow-hidden border-2 transition-all ${coverCard?.id === e.card.id ? 'border-green-500 ring-4 ring-green-500/20 scale-95 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                <img src={e.card.img} alt={e.card.name} className="w-full h-full object-cover" />
                                                {coverCard?.id === e.card.id && (
                                                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                                                        <Check size={20} className="text-green-600 drop-shadow-md" strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold italic ml-1">* Escolha a carta que representará o deck no seu perfil</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isPublic ? 'bg-zinc-800 text-white' : 'bg-red-100 text-red-600'}`}>
                                            {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-800">{isPublic ? 'Deck Público' : 'Deck Privado'}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium">Visível para outros no seu perfil?</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsPublic(!isPublic)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-green-500' : 'bg-zinc-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="flex-1 py-3 bg-white border-2 border-zinc-200 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveDeck}
                                    disabled={saving || !deckName || saveSuccess}
                                    className="flex-[2] py-3 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
                                    {saving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Confirmar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Deck Category Sub-Component ─────────────────
function DeckCategory({ title, color, entries, onAdd, onRemove, onRemoveAll, canAdd }: {
    title: string; color: string; entries: DeckEntry[];
    onAdd: (card: TcgCard) => void; onRemove: (id: string) => void; onRemoveAll: (id: string) => void;
    canAdd: (card: TcgCard) => { ok: boolean; reason?: string };
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</span>
            </div>
            <div className="space-y-1">
                {entries.map(entry => (
                    <div key={entry.card.id} className="flex items-center gap-2 bg-zinc-50 rounded-lg px-2 py-1.5 group hover:bg-zinc-100 transition-colors">
                        <img src={entry.card.img} alt={entry.card.name} className="w-8 h-11 rounded object-cover shadow-sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-800 truncate">{entry.card.name}</p>
                            <p className="text-[9px] text-zinc-400">{entry.card.setName}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button onClick={() => onRemove(entry.card.id)} className="w-5 h-5 rounded bg-zinc-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                                <Minus size={10} strokeWidth={3} />
                            </button>
                            <span className="text-xs font-bold w-5 text-center text-zinc-700">{entry.quantity}</span>
                            <button onClick={() => onAdd(entry.card)} disabled={!canAdd(entry.card).ok} className="w-5 h-5 rounded bg-zinc-200 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors disabled:opacity-40">
                                <Plus size={10} strokeWidth={3} />
                            </button>
                            <button onClick={() => onRemoveAll(entry.card.id)} className="w-5 h-5 rounded hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 ml-0.5">
                                <X size={10} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
