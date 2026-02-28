import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, ChevronDown, X, Image, FileText, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { fetchSets, searchCards, loadAllCards, isBasicEnergy, isCardValidForFormat, type TcgCard, type TcgSet, type TcgFormat } from '../hooks/tcgApi';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Deck Entry ──────────────────────────────────
interface DeckEntry {
    card: TcgCard;
    quantity: number;
}

// ─── Constants ───────────────────────────────────
const MAX_DECK_SIZE = 60;
const MAX_COPIES = 4;

// ─── Component ───────────────────────────────────
export function TcgDeckBuilder() {
    const { t } = useLanguage();

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
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Load Data on Mount ───────────────────────
    useEffect(() => {
        Promise.all([fetchSets(), loadAllCards()])
            .then(([setsData]) => {
                setSets(setsData);
                setDataReady(true);
            })
            .catch(err => console.error('Data load error:', err));
    }, []);

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
        <div className="flex flex-col lg:flex-row gap-6 relative">
            {/* ─── Gallery Panel ─── */}
            <div className="flex-1 min-w-0">
                {/* Search Controls */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-6 shadow-sm space-y-3">
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

                {/* Mobile deck toggle */}
                <button
                    onClick={() => setShowDeckPanel(!showDeckPanel)}
                    className="lg:hidden w-full mb-4 bg-white rounded-xl border border-zinc-200 p-3 flex items-center justify-between shadow-sm"
                >
                    <span className="font-bold text-zinc-700">
                        Deck: <span className="text-red-600">{deckCount}/{MAX_DECK_SIZE}</span>
                    </span>
                    <ChevronDown size={18} className={`text-zinc-400 transition-transform ${showDeckPanel ? 'rotate-180' : ''}`} />
                </button>

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
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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

            {/* ─── Deck Panel ─── */}
            <div className={`lg:w-80 xl:w-96 shrink-0 ${showDeckPanel ? 'block' : 'hidden lg:block'}`}>
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm sticky top-20 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">Deck Builder</h3>
                            <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded-lg ${deckCount > MAX_DECK_SIZE ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20'}`}>
                                {deckCount}/{MAX_DECK_SIZE}
                            </span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${deckCount > MAX_DECK_SIZE ? 'bg-yellow-400' : 'bg-white'}`}
                                style={{ width: `${Math.min((deckCount / MAX_DECK_SIZE) * 100, 100)}%` }}
                            />
                        </div>
                        {/* Format Toggle */}
                        <div className="flex items-center gap-2 mt-3">
                            <Shield size={14} />
                            <span className="text-xs font-semibold mr-auto">Format:</span>
                            <button onClick={() => setFormat('standard')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${format === 'standard' ? 'bg-white text-red-600' : 'bg-white/20 hover:bg-white/30'}`}>
                                Standard
                            </button>
                            <button onClick={() => setFormat('expanded')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${format === 'expanded' ? 'bg-white text-purple-600' : 'bg-white/20 hover:bg-white/30'}`}>
                                Expanded
                            </button>
                        </div>
                        {deckCount > MAX_DECK_SIZE && (
                            <div className="flex items-center gap-1 mt-2 text-yellow-200 text-xs font-semibold">
                                <AlertTriangle size={12} /> {(t as any).deckFull || 'Deck exceeds 60 cards!'}
                            </div>
                        )}
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto p-3 space-y-3">
                        {deck.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-zinc-400 text-sm">{(t as any).emptyDeck || 'Add cards to build your deck.'}</p>
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
                        <div className="p-3 border-t border-zinc-200 space-y-2">
                            <button onClick={exportText}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 text-white rounded-xl font-bold text-sm hover:bg-zinc-900 transition-colors">
                                <FileText size={16} /> {(t as any).exportText || 'Export for TCG Live'}
                            </button>
                            <button onClick={generateDeckSheet} disabled={generating}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-sm hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50">
                                {generating ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
                                {generating ? ((t as any).generating || 'Generating...') : ((t as any).generateSheet || 'Generate Deck Sheet')}
                            </button>
                            <button onClick={() => setDeck([])}
                                className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 rounded-xl font-semibold text-xs hover:text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 size={14} /> {(t as any).clearDeck || 'Clear Deck'}
                            </button>
                        </div>
                    )}
                </div>
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
