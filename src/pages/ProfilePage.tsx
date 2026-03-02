import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { RankAvatar } from '../components/RankAvatar';
import { getRankByContributions } from '../lib/rankUtils';
import { Trophy, Calendar, Flame, ChevronLeft, Layers, Bookmark, Shield, ShieldOff, Globe, Lock, X, FileText, Swords, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDecks, getUserTeams, subscribeToUserDecks, subscribeToUserTeams, countDeckCards } from '../lib/firestoreUtils';

interface ProfilePageProps {
    uid: string;
    onBack: () => void;
}

type Tab = 'activity' | 'decks' | 'teams';

export function ProfilePage({ uid, onBack }: ProfilePageProps) {
    const { user, profile: authProfile, loading: authLoading, signOut } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('activity');
    const [decks, setDecks] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [contentLoading, setContentLoading] = useState(false);

    const isOwnProfile = user?.uid === uid;

    const [selectedDeck, setSelectedDeck] = useState<any | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

    useEffect(() => {
        // 1. Wait for Auth to initialize
        if (authLoading) return;

        // 2. If it's the own profile, wait for the profile doc to be ready in context
        if (user && user.uid === uid) {
            if (authProfile) {
                setProfile(authProfile);
                setLoading(false);
            } else {
                // If auth is loaded but profile is null, it might be recreating. 
                // Keep loading until AuthProvider completes its setDoc/onSnapshot cycle.
                setLoading(true);
            }
        } else {
            // 3. Fetching someone else's profile (or own profile if context is delayed)
            async function fetchProfile() {
                // Only start fresh load if not already set or it's a new ID
                setLoading(true);
                try {
                    const docRef = doc(db, 'users', uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setProfile({ uid, ...docSnap.data() } as UserProfile);
                    } else {
                        setProfile(null);
                    }
                } catch (error) {
                    console.error("Erro ao carregar perfil:", error);
                    setProfile(null);
                } finally {
                    setLoading(false);
                }
            }
            fetchProfile();
        }
    }, [uid, user, authProfile, authLoading]);

    // Load Decks and Teams
    useEffect(() => {
        if (!uid) return;

        // If it's the owner, use real-time listeners
        if (isOwnProfile) {
            let unsubscribeDecks: (() => void) | undefined;
            let unsubscribeTeams: (() => void) | undefined;

            if (activeTab === 'decks') {
                setContentLoading(true);
                unsubscribeDecks = subscribeToUserDecks(uid, (fetchedDecks) => {
                    setDecks(fetchedDecks);
                    setContentLoading(false);
                });
            } else if (activeTab === 'teams') {
                setContentLoading(true);
                unsubscribeTeams = subscribeToUserTeams(uid, (fetchedTeams) => {
                    setTeams(fetchedTeams);
                    setContentLoading(false);
                });
            }

            return () => {
                if (unsubscribeDecks) unsubscribeDecks();
                if (unsubscribeTeams) unsubscribeTeams();
            };
        } else {
            // If it's another user's profile, use one-time fetch (public only)
            async function loadContent() {
                setContentLoading(true);
                try {
                    if (activeTab === 'decks') {
                        const fetchedDecks = await getUserDecks(uid, false);
                        setDecks(fetchedDecks);
                    } else if (activeTab === 'teams') {
                        const fetchedTeams = await getUserTeams(uid, false);
                        setTeams(fetchedTeams);
                    }
                } catch (error) {
                    console.error("Erro ao carregar conteúdo:", error);
                    if (activeTab === 'decks') setDecks([]);
                    if (activeTab === 'teams') setTeams([]);
                } finally {
                    setContentLoading(false);
                }
            }
            loadContent();
        }
    }, [uid, activeTab, isOwnProfile]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-zinc-500 font-medium">Carregando Perfil do Treinador...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-zinc-800">Treinador não encontrado</h2>
                <button
                    onClick={onBack}
                    className="mt-4 text-red-600 font-bold hover:underline flex items-center gap-2 mx-auto"
                >
                    <ChevronLeft size={20} /> Voltar
                </button>
            </div>
        );
    }

    const rank = getRankByContributions(profile.contributionCount || 0);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-red-600 font-bold transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar para o Feed
                </button>

                {isOwnProfile && (
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold transition-colors shadow-sm"
                        title="Sair da Conta"
                    >
                        <LogOut size={16} />
                        <span className="text-xs uppercase tracking-widest">Sair</span>
                    </button>
                )}
            </div>

            {/* Header Profile Section */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 overflow-hidden border border-zinc-100">
                <div className="h-40 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 relative">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                <div className="px-8 pb-8 relative">
                    {/* Avatar Positioned Overlay */}
                    <div className="absolute -top-16 left-8">
                        <RankAvatar
                            photoURL={profile.photoURL}
                            displayName={profile.displayName}
                            contributionCount={profile.contributionCount || 0}
                            size="xl"
                        />
                    </div>

                    <div className="pt-24 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter flex items-center gap-3 italic uppercase">
                                {profile.displayName || 'Treinador Misterioso'}
                            </h1>
                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-1 ml-1 flex items-center gap-2">
                                <Bookmark size={12} className="text-red-500" /> DefiniDEX Member
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <div className="bg-zinc-50 px-5 py-3 rounded-2xl border border-zinc-100 flex flex-col items-center min-w-[110px] shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Rank</span>
                                <span className="text-sm font-black uppercase italic tracking-tight" style={{ color: rank.color }}>{rank.name}</span>
                            </div>
                            <div className="bg-zinc-50 px-5 py-3 rounded-2xl border border-zinc-100 flex flex-col items-center min-w-[110px] shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Nível</span>
                                <span className="text-sm font-black text-zinc-800 uppercase italic">Lv. {Math.floor((profile.contributionCount || 0) / 2) + 1}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
                        <Flame size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Contribuições</p>
                        <p className="text-3xl font-black text-zinc-900 italic tracking-tighter">{profile.contributionCount || 0}</p>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 shadow-inner">
                        <Trophy size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Conquistas</p>
                        <p className="text-3xl font-black text-zinc-900 italic tracking-tighter">0</p>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                        <Calendar size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Membro desde</p>
                        <p className="text-sm font-black text-zinc-800 uppercase italic">
                            {profile.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Novato'}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Content Tabs */}
            <div className="mt-12 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm min-h-[400px] flex flex-col overflow-hidden">
                <div className="flex px-4 pt-4 bg-zinc-50 border-b border-zinc-100">
                    <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} label="Atividade" />
                    <TabButton active={activeTab === 'decks'} onClick={() => setActiveTab('decks')} label="Decks" count={decks.length} />
                    <TabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} label="Times" count={teams.length} />
                </div>

                <div className="p-8 flex-1">
                    <AnimatePresence mode="wait">
                        {contentLoading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            </motion.div>
                        ) : activeTab === 'activity' ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-16 text-zinc-400 text-center">
                                <Flame size={48} className="mb-4 opacity-10" />
                                <p className="font-black uppercase italic tracking-tighter text-lg">Nenhuma atividade recente</p>
                                <p className="text-[10px] uppercase font-bold tracking-widest mt-1">O treinador ainda está se preparando para a batalha</p>
                            </motion.div>
                        ) : activeTab === 'decks' ? (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {decks.length === 0 ? (
                                    <div className="col-span-full py-16 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">Nenhum deck público encontrado</div>
                                ) : (
                                    decks.map(deck => <div key={deck.id} onClick={() => setSelectedDeck(deck)} className="cursor-pointer"><DeckCard deck={deck} isOwn={isOwnProfile} /></div>)
                                )}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teams.length === 0 ? (
                                    <div className="col-span-full py-16 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">Nenhum time público encontrado</div>
                                ) : (
                                    teams.map(team => <div key={team.id} onClick={() => setSelectedTeam(team)} className="cursor-pointer"><TeamCard team={team} isOwn={isOwnProfile} /></div>)
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ─── Deck Modal ─── */}
            <AnimatePresence>
                {selectedDeck && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-zinc-800 h-[80vh] md:h-[600px]">

                            {/* Left Side: Generated Frame */}
                            <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-black/50 relative border-r border-zinc-800">
                                <h3 className="text-3xl font-black italic uppercase text-white mb-6 tracking-tighter self-start w-full truncate px-4">{selectedDeck.name}</h3>

                                <div className="relative w-64 aspect-[245/342] mb-6 drop-shadow-2xl">
                                    <img src={selectedDeck.coverCardImg} alt="Cover" className="absolute inset-0 w-full h-full object-cover rounded-xl border-4 border-zinc-800" />
                                </div>
                            </div>

                            {/* Right Side: Card List */}
                            <div className="md:w-1/2 flex flex-col bg-zinc-900 relative">
                                <button onClick={() => setSelectedDeck(null)} className="absolute top-4 right-4 p-2 bg-zinc-800 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-white transition-colors z-10">
                                    <X size={20} />
                                </button>

                                <div className="p-8 pb-4 border-b border-zinc-800">
                                    <h4 className="text-red-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                        <FileText size={16} /> Deck List ({countDeckCards(selectedDeck.cards)})
                                    </h4>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {selectedDeck.cards.map((c: any) => (
                                        <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-800/50">
                                            <div className="w-12 h-16 shrink-0 rounded overflow-hidden">
                                                <img src={c.card.img} alt={c.card.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold truncate text-sm">{c.card.name}</p>
                                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{c.card.set} • {c.card.supertype}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-zinc-900 rounded-lg text-red-500 font-black italic">
                                                x{c.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-zinc-800">
                                    <button onClick={() => {
                                        const text = selectedDeck.cards.map((c: any) => `${c.quantity} ${c.card.name} ${c.card.set} ${c.card.number}`).join('\n');
                                        navigator.clipboard.writeText(text);
                                        alert('Exportado para a área de transferência!');
                                    }} className="w-full py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-colors cursor-pointer">
                                        Exportar TCG Live
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Team Modal ─── */}
            <AnimatePresence>
                {selectedTeam && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative">

                            <button onClick={() => setSelectedTeam(null)} className="absolute top-4 right-4 p-2 bg-zinc-100 text-zinc-400 rounded-full hover:bg-zinc-200 hover:text-red-600 transition-colors z-10">
                                <X size={20} />
                            </button>

                            <div className="bg-gradient-to-r from-red-600 to-red-800 p-8 text-white relative overflow-hidden">
                                <Swords size={120} className="absolute -right-4 -top-4 text-white/10 rotate-12" />
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter truncate max-w-[80%]">{selectedTeam.name}</h3>
                                <p className="text-red-100 font-bold uppercase tracking-widest text-xs mt-1">VGC Team</p>
                            </div>

                            <div className="p-6 bg-zinc-50 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedTeam.pokemons.map((p: any, i: number) => (
                                        <div key={i} className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex flex-col relative group">
                                            <div className="w-20 h-20 bg-zinc-50 rounded-full border-4 border-white shadow-md absolute -top-4 -right-4 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                                                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} alt="pkmn" className="w-[120%] h-[120%] object-contain" />
                                            </div>

                                            <div className="flex gap-2 items-center mb-3">
                                                <span className="text-xl font-black tracking-tight uppercase text-zinc-800">#{p.pokemonId}</span>
                                                {p.item && (
                                                    <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200" title={p.item}>
                                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${p.item}.png`} alt={p.item} className="w-4/5 h-4/5 object-contain" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1 mt-2">
                                                {p.moves.map((m: string, idx: number) => (
                                                    <div key={idx} className="bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100 text-xs font-bold uppercase text-zinc-600">
                                                        {m ? m.replace('-', ' ') : '-'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-white border-t border-zinc-100">
                                <button onClick={() => {
                                    let text = '';
                                    selectedTeam.pokemons.forEach((p: any) => {
                                        text += `${p.pokemonId}\n`;
                                        if (p.item) text += `Item: ${p.item}\n`;
                                        p.moves.forEach((m: string) => {
                                            if (m) text += `- ${m}\n`;
                                        });
                                        text += '\n';
                                    });
                                    navigator.clipboard.writeText(text);
                                    alert('Exportado formato Showdown!');
                                }} className="w-full py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-colors cursor-pointer">
                                    Exportar Showdown
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
}

function TabButton({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count?: number }) {
    return (
        <button
            onClick={onClick}
            className={`px-8 py-4 font-black uppercase italic tracking-tighter text-sm transition-all relative border-b-4 ${active ? 'border-red-600 text-red-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-lg text-[9px] font-black ${active ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function DeckCard({ deck, isOwn }: { deck: any, isOwn: boolean }) {
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-zinc-50 rounded-3xl overflow-hidden border border-zinc-100 group shadow-sm hover:shadow-xl transition-all">
            <div className="aspect-[245/342] relative overflow-hidden bg-zinc-200">
                <img src={deck.coverCardImg} alt={deck.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                    <h4 className="text-white font-black italic uppercase tracking-tighter text-lg truncate">{deck.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{countDeckCards(deck.cards)} Cartas</span>
                        {isOwn && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md flex items-center gap-1">
                                {deck.isPublic ? <Globe size={8} /> : <Lock size={8} />}
                                {deck.isPublic ? 'Público' : 'Privado'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function TeamCard({ team, isOwn }: { team: any, isOwn: boolean }) {
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-black italic uppercase tracking-tighter text-zinc-800 text-lg truncate flex-1">{team.name}</h4>
                {isOwn && (
                    <div className={`p-1.5 rounded-lg ${team.isPublic ? 'bg-zinc-100 text-zinc-400' : 'bg-red-50 text-red-600'}`}>
                        {team.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-3 gap-2">
                {team.pokemons.slice(0, 6).map((p: any, i: number) => (
                    <div key={i} className="aspect-square bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-center p-1">
                        <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`}
                            alt="pkmn"
                            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                        />
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">VGC Team</span>
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest italic">Ver Detalhes</span>
            </div>
        </motion.div>
    );
}
