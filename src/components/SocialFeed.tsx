import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Import, User, Globe, MessageSquare, ChevronDown, ChevronUp, Share2, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribeToSocialFeed, toggleLike, checkIfLiked, importItem, countDeckCards } from '../lib/firestoreUtils';

interface SocialFeedProps {
    type: 'tcg' | 'vgc';
    onNavigateToProfile: (uid: string) => void;
    onImportSuccess?: () => void;
}

export function SocialFeed({ type, onNavigateToProfile, onImportSuccess }: SocialFeedProps) {
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const [items, setItems] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
    const [importingId, setImportingId] = useState<string | null>(null);
    const [selectedPreviewItem, setSelectedPreviewItem] = useState<any | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToSocialFeed(type, (newItems) => {
            setItems(newItems);
        });
        return unsubscribe;
    }, [type]);

    useEffect(() => {
        if (user && items.length > 0) {
            items.forEach(async (item) => {
                if (likedItems[item.id] === undefined) {
                    const liked = await checkIfLiked(user.uid, item.id, type);
                    setLikedItems(prev => ({ ...prev, [item.id]: liked }));
                }
            });
        }
    }, [user, items]);

    const handleLike = async (itemId: string) => {
        if (!user) return;
        try {
            const isLiked = await toggleLike(user.uid, itemId, type);
            setLikedItems(prev => ({ ...prev, [itemId]: isLiked }));
        } catch (err) {
            console.error("Error liking:", err);
        }
    };

    const handleImport = (item: any) => {
        setSelectedPreviewItem(item);
    };

    const confirmImport = async () => {
        if (!user || !selectedPreviewItem) return;
        const itemToImport = selectedPreviewItem;
        setImportingId(itemToImport.id);
        setSelectedPreviewItem(null);
        try {
            await importItem(user.uid, itemToImport, type);
            if (onImportSuccess) onImportSuccess();
            alert(t.imported);
        } catch (err) {
            console.error("Error importing:", err);
            alert(t.importError);
        } finally {
            setImportingId(null);
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-col w-80 shrink-0 bg-white border-l border-zinc-100 h-[calc(100vh-8rem)] sticky top-24 overflow-hidden rounded-r-[2rem] shadow-sm">
                <div className="p-6 border-b border-zinc-50 bg-zinc-50/50">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-zinc-800 flex items-center gap-2">
                        <Globe size={20} className="text-red-500" />
                        {t.socialFeed}
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        {type === 'tcg' ? 'Pokémon TCG' : 'VGC Battles'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <AnimatePresence>
                        {items.map((item) => (
                            <FeedItem
                                key={item.id}
                                item={item}
                                type={type}
                                isLiked={likedItems[item.id]}
                                onLike={() => handleLike(item.id)}
                                onImport={() => handleImport(item)}
                                onProfile={() => onNavigateToProfile(item.uid)}
                                currentUid={user?.uid}
                                isImporting={importingId === item.id}
                                t={t}
                            />
                        ))}
                    </AnimatePresence>
                    {items.length === 0 && (
                        <div className="py-20 text-center text-zinc-400">
                            <p className="text-sm font-bold uppercase tracking-widest italic">{t.noNews || 'Nada novo por aqui'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Sheet Drawer */}
            {typeof document !== 'undefined' && document.body ? createPortal(
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
                    <motion.div
                        initial={false}
                        animate={{ height: isExpanded ? '70vh' : '60px' }}
                        className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-zinc-100 flex flex-col overflow-hidden mx-auto max-w-full"
                    >
                        {/* Pull Handle / Header */}
                        <div
                            className="h-[60px] flex items-center justify-between px-8 cursor-pointer shrink-0"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                                    <Globe size={18} />
                                </div>
                                <span className="font-black italic uppercase tracking-tight text-zinc-800">{t.socialFeed}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    {items.length}
                                </div>
                                {isExpanded ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronUp size={20} className="text-zinc-400" />}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-4 custom-scrollbar">
                            {items.map((item) => (
                                <FeedItem
                                    key={item.id}
                                    item={item}
                                    type={type}
                                    isLiked={likedItems[item.id]}
                                    onLike={() => handleLike(item.id)}
                                    onImport={() => handleImport(item)}
                                    onProfile={() => onNavigateToProfile(item.uid)}
                                    currentUid={user?.uid}
                                    isImporting={importingId === item.id}
                                    t={t}
                                    isMobile
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>,
                document.body
            ) : null}
            {/* Import Preview Modal */}
            <AnimatePresence>
                {selectedPreviewItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
                        onClick={() => setSelectedPreviewItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
                                <div>
                                    <p className="text-[10px] font-black text-red-500 mb-1 uppercase tracking-widest leading-none">{t.importPreview}</p>
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedPreviewItem.name}</h2>
                                    <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                                        <User size={10} /> {selectedPreviewItem.userName || t.trainer} • {countDeckCards(selectedPreviewItem.cards)} CARDS
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedPreviewItem(null)}
                                    className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-white rounded-full flex items-center justify-center transition-colors"
                                >
                                    <ChevronDown size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
                                {type === 'tcg' ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {selectedPreviewItem.cards?.map((entry: any, idx: number) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={entry.card?.img || entry.img}
                                                    alt="card"
                                                    className="w-full rounded-lg shadow-lg border border-zinc-800"
                                                />
                                                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                                    {entry.quantity || 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedPreviewItem.pokemons?.map((p: any, idx: number) => (
                                            <div key={idx} className="bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 border border-zinc-700/50">
                                                <div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center shadow-inner">
                                                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} className="w-full h-full object-contain" alt="pkmn" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-black italic uppercase tracking-tight">{p.nickname || p.pokemonName}</h4>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {p.moves?.map((m: any, mi: number) => (
                                                            <span key={mi} className="text-[8px] font-bold bg-black/40 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-widest">{m}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 shrink-0">
                                <button
                                    onClick={confirmImport}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-900/20 active:scale-[0.98]"
                                >
                                    <Import size={20} strokeWidth={3} />
                                    {t.confirmImport}
                                </button>
                                <p className="text-[9px] text-center text-zinc-500 mt-3 font-bold uppercase tracking-widest opacity-60">
                                    {t.saveNotice}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function FeedItem({ item, type, isLiked, onLike, onImport, onProfile, currentUid, isImporting, t, isMobile }: any) {
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const lastTap = useRef<number>(0);

    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if (!isLiked) {
                onLike();
                setShowHeartAnim(true);
                setTimeout(() => setShowHeartAnim(false), 800);
            }
        }
        lastTap.current = now;
    };

    const isOwn = currentUid === item.uid;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-50 rounded-3xl p-4 border border-zinc-100 relative overflow-hidden group"
            onClick={isMobile ? handleDoubleTap : undefined}
        >
            <div className="flex items-start gap-3">
                <div
                    className="shrink-0 cursor-pointer"
                    onClick={onProfile}
                    role="button"
                    title={t.showProfile}
                >
                    {item.userPhotoURL ? (
                        <img src={item.userPhotoURL} alt={item.userName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-300 border-2 border-white shadow-sm">
                            <User size={20} />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p
                            className="text-xs font-black text-zinc-800 italic truncate cursor-pointer hover:text-red-600 transition-colors"
                            onClick={onProfile}
                            role="button"
                            title={t.showProfile}
                        >
                            {isOwn ? t.you : item.userName || 'Treinador'}
                        </p>
                        <span className="text-[8px] font-bold text-zinc-400">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-black text-zinc-900 leading-tight mt-0.5 truncate uppercase italic tracking-tighter">
                        {item.name}
                    </h3>

                    {/* Content Preview */}
                    <div className="mt-3 flex gap-2">
                        {type === 'tcg' ? (
                            <div className="w-full h-16 bg-zinc-200 rounded-xl overflow-hidden relative shadow-inner">
                                <img src={item.coverCardImg} alt="Cover" className="w-full h-full object-cover grayscale-[0.5] opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest">
                                        {countDeckCards(item.cards)} Cards
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-1 w-full">
                                {item.pokemons?.slice(0, 3).map((p: any, i: number) => (
                                    <div key={i} className="aspect-square bg-zinc-200 rounded-xl flex items-center justify-center p-1 shadow-inner">
                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} className="w-full h-full object-contain" alt="pkmn" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); onLike(); }}
                                className={`flex items-center gap-1.5 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-zinc-400 hover:text-red-400'}`}
                            >
                                <Heart size={16} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
                                <span className="text-[10px] font-black">{item.likesCount || 0}</span>
                            </button>
                            <button className="text-zinc-400 hover:text-blue-400 transition-colors">
                                <Share2 size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {!isOwn && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onImport(); }}
                                disabled={isImporting}
                                className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-zinc-100 text-zinc-600 hover:text-red-600 hover:border-red-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <Import size={14} strokeWidth={2.5} />
                                <span className="text-[9px] font-black uppercase tracking-tight">Import</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Float Heart Animation (Double Tap) */}
            <AnimatePresence>
                {showHeartAnim && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                        <Heart size={64} fill="#ef4444" className="text-red-500 drop-shadow-lg" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
