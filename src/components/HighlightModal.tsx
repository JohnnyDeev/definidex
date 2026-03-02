import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Heart, Import, User, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { countDeckCards, subscribeToComments, addComment, type Comment, toggleLike, checkIfLiked, importItem } from '../lib/firestoreUtils';
import { RankAvatar } from './RankAvatar';
import { sanitizeContent } from '../lib/sanitization';

interface HighlightModalProps {
    item: any;
    type: 'tcg' | 'vgc';
    onClose: () => void;
}

export function HighlightModal({ item, type, onClose }: HighlightModalProps) {
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(item.likesCount || 0);
    const [showHeartAnim, setShowHeartAnim] = useState(false);

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Initial like check
    useEffect(() => {
        if (user && item) {
            checkIfLiked(user.uid, item.id, type).then(liked => setIsLiked(liked));
        }
    }, [user, item, type]);

    // Sub to comments
    useEffect(() => {
        if (!item) return;
        const unsub = subscribeToComments(item.id, (newComments) => {
            setComments(newComments);
        });
        return unsub;
    }, [item]);

    const handleLike = async () => {
        if (!user) {
            alert("Faça login para curtir.");
            return;
        }
        try {
            // Optimistic update
            const wasLiked = isLiked;
            setIsLiked(!wasLiked);
            setLikesCount(prev => prev + (wasLiked ? -1 : 1));
            if (!wasLiked) {
                setShowHeartAnim(true);
                setTimeout(() => setShowHeartAnim(false), 800);
            }

            const currentLiked = await toggleLike(user.uid, item.id, type);
            setIsLiked(currentLiked);
        } catch (err) {
            console.error("Error toggling like:", err);
            // Revert on error
            setIsLiked(!isLiked);
            setLikesCount(prev => prev + (!isLiked ? -1 : 1));
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const sanitizedText = sanitizeContent(newComment.trim());
            await addComment(
                user.uid,
                user.displayName || 'Treinador',
                user.photoURL || undefined,
                sanitizedText,
                item.id,
                type
            );
            setNewComment('');
        } catch (err) {
            console.error("Error adding comment:", err);
            alert("Erro ao enviar comentário.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmImport = async () => {
        if (!user) {
            alert("Faça login para importar.");
            return;
        }
        setIsImporting(true);
        try {
            await importItem(user.uid, item, type);
            alert(t.imported);
            onClose();
        } catch (err: any) {
            console.error("Error importing:", err);
            alert(t.importError || "Erro ao importar.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Left Side: Preview area (Cards/Pokemons) - takes more space on desktop */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 flex flex-col relative">
                    <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                        <div>
                            <p className="text-[10px] font-black text-red-500 mb-1 uppercase tracking-widest leading-none">
                                {type === 'tcg' ? 'Pokémon TCG Deck' : 'VGC Team'}
                            </p>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{item.name}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <RankAvatar
                                    photoURL={item.userPhotoURL}
                                    displayName={item.userName || 'Treinador'}
                                    contributionCount={(item as any).contributionCount || 0}
                                    size="sm"
                                />
                                <span className="text-zinc-400 font-bold text-xs">{item.userName || t.trainer}</span>
                                <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded uppercase tracking-widest">
                                    {type === 'tcg' ? `${countDeckCards(item.cards)} CARDS` : `${item.pokemons?.length || 0} POKÉMON`}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-white rounded-full flex items-center justify-center transition-colors md:hidden"
                        >
                            <ChevronDown size={24} />
                        </button>
                    </div>

                    <div className="flex-1 p-6">
                        {type === 'tcg' ? (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 lg:gap-3">
                                {item.cards?.map((entry: any, idx: number) => (
                                    <div key={idx} className="relative group">
                                        <img
                                            src={entry.card?.img || entry.img}
                                            alt="card"
                                            className="w-full rounded-lg shadow-lg border border-zinc-800 hover:scale-110 hover:-translate-y-2 transition-all duration-300 relative z-10 hover:z-20 cursor-pointer"
                                        />
                                        <div className="absolute -top-2 -right-2 z-30 bg-red-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shadow-md">
                                            {entry.quantity || 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {item.pokemons?.map((p: any, idx: number) => (
                                    <div key={idx} className="bg-zinc-900 p-4 rounded-2xl flex items-center gap-4 border border-zinc-800">
                                        <div className="w-16 h-16 bg-zinc-950 rounded-xl flex items-center justify-center shadow-inner">
                                            <img src={p.sprite || (p.pokemonId ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png` : '')} className="w-full h-full object-contain hover:scale-125 transition-transform" alt="pkmn" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-black italic uppercase tracking-tight text-lg">{p.nickname || p.pokemonName}</h4>
                                                {p.item && (
                                                    <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold">Item: {p.item}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {p.moves?.map((m: any, mi: number) => (
                                                    <span key={mi} className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase tracking-widest">{m}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 sticky bottom-0 shrink-0 flex items-center justify-between">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-all px-4 py-2 rounded-xl border ${isLiked ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-red-400'}`}
                        >
                            <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2.5} />
                            <span className="font-black text-sm">{likesCount}</span>
                        </button>

                        <button
                            onClick={confirmImport}
                            disabled={isImporting || item.uid === user?.uid}
                            className="bg-white text-zinc-900 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Import size={18} strokeWidth={2.5} />
                            {item.uid === user?.uid ? "Seu item" : t.confirmImport}
                        </button>
                    </div>
                </div>

                {/* Right Side: Comments - smaller width on desktop */}
                <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col bg-zinc-950 h-[50vh] md:h-auto shrink-0">
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
                        <h3 className="text-white font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <MessageSquare size={16} className="text-blue-500" />
                            {t.comments || "Comentários"}
                        </h3>
                        <div className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {comments.length}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-zinc-800 text-zinc-400 hover:text-white rounded-full hidden md:flex items-center justify-center transition-colors"
                        >
                            <ChevronDown size={20} className="rotate-[-90deg]" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                        {comments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                <MessageSquare size={32} className="text-zinc-800 mb-3" />
                                <p className="text-zinc-500 text-sm font-bold">{t.noComments || "Seja o primeiro a comentar!"}</p>
                            </div>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        {c.userPhotoURL ? (
                                            <img src={c.userPhotoURL} alt={c.userName} className="w-6 h-6 rounded-full" />
                                        ) : (
                                            <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
                                                <User size={12} />
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-zinc-300">{c.userName || 'Treinador'}</span>
                                        <span className="text-[9px] text-zinc-600 font-bold ml-auto">
                                            {c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 break-words whitespace-pre-wrap">{c.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
                        {user ? (
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={"Escreva algo legal..."}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                                    disabled={isSubmitting}
                                    maxLength={200}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        ) : (
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 font-bold">{"Faça login para comentar."}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Float Heart */}
                <AnimatePresence>
                    {showHeartAnim && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]"
                        >
                            <Heart size={80} fill="#ef4444" className="text-red-500 drop-shadow-[0_10px_30px_rgba(239,68,68,0.5)]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
