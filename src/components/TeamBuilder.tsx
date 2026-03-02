import React, { useState, useRef, useEffect } from 'react';
import { Team, TeamPokemon } from '../hooks/useTeamStore';
import { Plus, Trash2, Save, X, Search, Download, Upload, Filter, Layers, ChevronDown, Globe, Lock, Check, Loader2, AlertCircle } from 'lucide-react';
import { usePokemonList } from '../hooks/usePokemonList';
import { usePokemonDetails } from '../hooks/usePokemonDetails';
import { useItemsList } from '../hooks/useItemsList';
import { ALL_TYPES, GENERATIONS } from '../constants';
import { typeColors } from './TypeBadge';
import { VGCStats } from './VGCStats';
import { useAuth } from '../contexts/AuthContext';
import { saveTeam, subscribeToUserTeams, deleteTeam as deleteTeamFirestore } from '../lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import { SocialFeed } from './SocialFeed';

// Helper to parse Showdown text format
function parseShowdown(text: string): Partial<TeamPokemon> | null {
  try {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return null;

    const firstLine = lines[0].split('@');
    const name = firstLine[0].trim();
    const item = firstLine[1] ? firstLine[1].trim().toLowerCase().replace(/ /g, '-') : '';

    const moves: string[] = [];
    lines.forEach(line => {
      if (line.trim().startsWith('- ')) {
        moves.push(line.trim().substring(2).toLowerCase().replace(/ /g, '-'));
      }
    });

    return {
      pokemonId: 0,
      item,
      moves: moves.slice(0, 4)
    };
  } catch (e) {
    return null;
  }
}

interface TeamBuilderProps {
  onNavigateToProfile?: (uid: string) => void;
}

export function TeamBuilder({ onNavigateToProfile }: TeamBuilderProps) {
  const { user, profile, setShowAuthModal } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null) as any;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setTeams([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserTeams(user.uid, (updatedTeams) => {
      setTeams(updatedTeams as Team[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // loadTeams is now obsolete, but we keep the name for SocialFeed compatibility if needed, 
  // though onSnapshot handles it automatically.
  const loadTeams = () => {
    // No-op because subscription handles updates
    console.log('Real-time subscription is active. Manual reload skipped.');
  };

  const handleSaveTeam = async () => {
    if (!user || !editingTeam) {
      console.warn('Save team attempt blocked:', { hasUser: !!user, hasEditingTeam: !!editingTeam });
      return;
    }

    setSaving(true);
    console.log('Initiating team save...', { uid: user.uid, teamName: editingTeam.name });

    try {
      // Check if it's a real Firestore ID or a temporary timestamp string
      const isExistingTeam = editingTeam.id && !/^\d+$/.test(editingTeam.id);

      const teamData = {
        name: editingTeam.name,
        pokemons: editingTeam.pokemons,
        isPublic
      };

      const resultId = await saveTeam(
        user.uid,
        teamData,
        isExistingTeam ? editingTeam.id : undefined,
        profile?.displayName || user.displayName || user.email?.split('@')[0],
        profile?.photoURL || user.photoURL || undefined
      );
      console.log('Team saved successfully. Doc ID:', resultId);

      setSaveSuccess(true);
      // No manual loadTeams needed
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSaveModal(false);
        setEditingTeam(null);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving team:', error);
      alert(`Erro ao salvar o time: ${error.message || 'Tente novamente.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!user || !window.confirm('Excluir este time permanentemente?')) return;
    try {
      console.log(`[Diagnostic] UI: Initiating deletion for team ${teamId}`);
      await deleteTeamFirestore(teamId);

      // Clear editing state if the deleted team was being edited
      if (editingTeam && editingTeam.id === teamId) {
        setEditingTeam(null);
      }

      // No manual loadTeams needed thanks to subscription
      alert('Time excluído com sucesso. Se o time ainda aparecer, verifique o console (F12) para os logs [Diagnostic].');
    } catch (error: any) {
      console.error('[Diagnostic] UI: Error deleting team:', error);
      alert(`Erro ao excluir o time: ${error.message || 'Tente novamente.'}`);
    }
  };

  const handleExport = () => {
    if (!teams || teams.length === 0) return;
    const currentTeam = editingTeam || teams[0];
    let showdownText = '';

    currentTeam.pokemons.forEach(p => {
      showdownText += `${p.pokemonId}\n`;
      if (p.item) showdownText += `Item: ${p.item}\n`;
      p.moves.forEach(m => {
        if (m) showdownText += `- ${m}\n`;
      });
      showdownText += '\n';
    });

    navigator.clipboard.writeText(showdownText);
    alert('Time copiado no formato Showdown!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
        <p className="text-zinc-500 font-semibold">Carregando seus times...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8 mt-2">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900">Meus Times VGC</h2>
          <p className="text-zinc-500 font-medium">
            {user ? (
              <>Treinando como <span className="text-red-600 font-bold">{user.displayName}</span></>
            ) : (
              'Monte seu time e salve no seu perfil'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingTeam({ id: Date.now().toString(), name: 'Novo Time', pokemons: [] })}
            className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Criar Time
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 order-1">
          {editingTeam ? (
            <TeamEditor
              team={editingTeam}
              onSave={(t) => {
                setEditingTeam(t);
                if (user) {
                  setShowSaveModal(true);
                } else {
                  setShowAuthModal(true);
                }
              }}
              onCancel={() => setEditingTeam(null)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-zinc-100 flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 text-zinc-300">
                    <Layers size={32} />
                  </div>
                  <p className="text-zinc-400 font-bold tracking-tight">Nenhum time criado ainda.</p>
                  <p className="text-zinc-400 text-sm">Use o botão acima para começar seu primeiro esquadrão.</p>
                </div>
              ) : (
                teams.map(team => (
                  <motion.div
                    layout
                    key={team.id}
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 hover:shadow-xl hover:shadow-zinc-200/50 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-black text-zinc-800 tracking-tight">{team.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {team.isPublic ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                              <Globe size={10} /> Público
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1">
                              <Lock size={10} /> Privado
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingTeam(team)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                          <Plus size={16} />
                        </button>
                        <button onClick={() => handleDeleteTeam(team.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {team.pokemons.map((p, i) => (
                        <div key={i} className="aspect-square bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-center overflow-hidden relative group/mon">
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`}
                            alt="pokemon"
                            className="w-full h-full object-contain drop-shadow-sm group-hover/mon:scale-110 transition-transform"
                          />
                          {p.item && (
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-white rounded-lg border border-zinc-100 flex items-center justify-center p-1 shadow-sm">
                              <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${p.item}.png`}
                                alt={p.item}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      {Array.from({ length: 6 - team.pokemons.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed" />
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="lg:w-80 order-2">
          <VGCStats onSelect={(pokemonData) => {
            const newPokemon: TeamPokemon = {
              pokemonId: pokemonData.id,
              moves: pokemonData.moves,
              item: pokemonData.item
            };

            if (!editingTeam) {
              setEditingTeam({
                id: Date.now().toString(),
                name: 'Novo Time',
                pokemons: [newPokemon]
              });
            } else {
              const currentCount = editingTeam.pokemons.length;
              if (currentCount < 6) {
                const newPokemons = [...editingTeam.pokemons, newPokemon];
                setEditingTeam({ ...editingTeam, pokemons: newPokemons });
              } else {
                alert('Time cheio! Remova algum Pokémon primeiro.');
              }
            }
          }} />

          {/* Social Feed - Integrated below stats */}
          <div className="mt-8">
            <SocialFeed
              type="vgc"
              onNavigateToProfile={onNavigateToProfile || (() => { })}
              onImportSuccess={loadTeams}
            />
          </div>
        </div>
      </div>

      {/* ─── Save Team Modal ─── */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                  <Save size={32} />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Salvar Time</h3>
                <p className="text-red-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Persistência na Cloud</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isPublic ? 'bg-zinc-800 text-white' : 'bg-red-100 text-red-600'}`}>
                      {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-800 uppercase tracking-tight">{isPublic ? 'Time Público' : 'Time Privado'}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Exibir no perfil?</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-14 h-7 rounded-full relative transition-all ${isPublic ? 'bg-green-500 shadow-inner' : 'bg-zinc-300'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${isPublic ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 italic">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 font-bold leading-tight uppercase tracking-wider">
                    Salvar o time aumentará sua pontuação de contribuidor e seu Rank na plataforma!
                  </p>
                </div>
              </div>

              <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex gap-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-4 bg-white border-2 border-zinc-200 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTeam}
                  disabled={saving || saveSuccess}
                  className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Save size={16} />}
                  {saving ? 'Salvando...' : saveSuccess ? 'Sucesso!' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamEditor({ team, onSave, onCancel }: { team: Team, onSave: (t: Team) => void, onCancel: () => void }) {
  const [name, setName] = useState(team.name);
  const [pokemons, setPokemons] = useState<TeamPokemon[]>(team.pokemons);
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);
  const [pendingPaste, setPendingPaste] = useState<Partial<TeamPokemon> | null>(null);

  useEffect(() => {
    if (team.pokemons.length !== pokemons.length) {
      setPokemons(team.pokemons);
    }
  }, [team.pokemons]);

  const handleSave = () => {
    onSave({ ...team, name, pokemons });
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[5rem] -mr-16 -mt-16 opacity-50" />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-10 relative z-10">
        <div className="flex-1 max-w-md">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-1 block">Nome do Esquadrão</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Rain Team, Trick Room..."
            className="text-2xl font-black italic uppercase tracking-tighter bg-transparent border-b-4 border-zinc-100 focus:border-red-600 outline-none px-1 py-2 w-full transition-all"
          />
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={onCancel} className="px-6 py-3 text-zinc-400 hover:text-zinc-600 font-black uppercase text-xs tracking-widest transition-colors">Voltar</button>
          <button onClick={handleSave} className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95">
            <Save size={18} /> Salvar Time
          </button>
        </div>
      </div>

      <div className="mb-10 flex flex-wrap gap-4">
        <button
          onClick={() => {
            const text = prompt('Cole o texto do Showdown aqui (Ex: Miraidon @ Choice Specs...):');
            if (text) {
              const imported = parseShowdown(text);
              if (imported) {
                setPendingPaste(imported);
                alert('Pronto! Agora clique em um slot (+) para aplicar este set.');
              } else {
                alert('Não foi possível detectar o Pokémon. Verifique se o formato está correto.');
              }
            }
          }}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-50 border border-zinc-100 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition-all flex items-center gap-2"
        >
          <Upload size={14} /> Importar Showdown
        </button>
        {pendingPaste && (
          <button
            onClick={() => setPendingPaste(null)}
            className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 px-2 flex items-center gap-1"
          >
            <X size={14} /> Cancelar Colagem
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => {
          const p = pokemons[i];
          return (
            <div key={i} className={`rounded-3xl border-2 p-5 relative min-h-[220px] flex flex-col transition-all overflow-hidden ${p ? 'bg-zinc-50 border-zinc-100' : 'bg-zinc-50/50 border-dashed border-zinc-200 hover:border-red-200 hover:bg-red-50/30'}`}>
              {pendingPaste && !p && (
                <button
                  onClick={() => setSelectingSlot(i)}
                  className="absolute inset-0 z-20 bg-red-600/5 backdrop-blur-[1px] rounded-3xl flex flex-col items-center justify-center border-2 border-red-500 border-dashed animate-pulse"
                >
                  <Plus size={32} className="text-red-600 mb-2" />
                  <span className="text-red-600 font-black uppercase text-[10px] tracking-widest">Aplicar Set</span>
                </button>
              )}
              {p ? (
                <PokemonSlotEditor
                  pokemon={p}
                  onChange={(newP) => {
                    const newPokemons = [...pokemons];
                    newPokemons[i] = newP;
                    setPokemons(newPokemons);
                  }}
                  onRemove={() => {
                    const newPokemons = [...pokemons];
                    newPokemons.splice(i, 1);
                    setPokemons(newPokemons);
                  }}
                />
              ) : (
                <button
                  onClick={() => setSelectingSlot(i)}
                  className="flex-1 flex flex-col items-center justify-center text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <Plus size={40} className="mb-2 transition-transform hover:rotate-90 duration-300" />
                  <span className="font-black uppercase text-[10px] tracking-widest">Adicionar Pokémon</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectingSlot !== null && (
        <PokemonSelector
          onSelect={(id: number) => {
            const newPokemons = [...pokemons];
            const basePokemon = { pokemonId: id, moves: [] as string[] };

            if (pendingPaste) {
              newPokemons[selectingSlot] = {
                ...basePokemon,
                moves: pendingPaste.moves || [],
                item: pendingPaste.item
              };
              setPendingPaste(null);
            } else {
              newPokemons[selectingSlot] = basePokemon;
            }

            setPokemons(newPokemons);
            setSelectingSlot(null);
          }}
          onClose={() => {
            setSelectingSlot(null);
            setPendingPaste(null);
          }}
        />
      )}
    </div>
  );
}

function PokemonSlotEditor({ pokemon, onChange, onRemove }: { pokemon: TeamPokemon, onChange: (p: TeamPokemon) => void, onRemove: () => void }) {
  const { details } = usePokemonDetails(pokemon.pokemonId);
  const { items } = useItemsList();

  if (!details) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={24} className="text-zinc-200 animate-spin" />
    </div>
  );

  const selectedItemData = items.find(i => i.name === pokemon.item);

  return (
    <>
      <button onClick={onRemove} className="absolute top-4 right-4 text-zinc-300 hover:text-red-600 transition-colors">
        <X size={18} strokeWidth={3} />
      </button>
      <div className="flex items-start gap-4 mb-6">
        <div className="relative group/sprite">
          <img src={details.sprite} alt={details.name} className="w-20 h-20 object-contain drop-shadow-xl group-hover/sprite:scale-110 transition-transform" />
          <div className="absolute -bottom-1 -right-1 w-11 h-11 bg-white rounded-2xl border-2 border-zinc-50 flex items-center justify-center p-2 shadow-lg z-10 transition-transform hover:scale-110">
            <img
              src={selectedItemData?.id
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${selectedItemData.id}.png`
                : pokemon.item ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${pokemon.item}.png` : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
              }
              alt={pokemon.item || 'no item'}
              className={`w-full h-full object-contain ${!pokemon.item ? 'opacity-20 grayscale' : ''}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black italic uppercase tracking-tighter text-zinc-800 text-lg truncate mb-1">{details.name.replace('-', ' ')}</h4>
          <div className="flex gap-1 mb-3">
            {details.types.map(t => (
              <span key={t} className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg text-white ${typeColors[t]?.split(' ')[0] || 'bg-zinc-400'}`}>{t}</span>
            ))}
          </div>
          <select
            value={pokemon.item || ''}
            onChange={(e) => onChange({ ...pokemon, item: e.target.value })}
            className="w-full bg-white border border-zinc-100 rounded-xl px-2 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none focus:border-red-600 transition-all text-zinc-500"
          >
            <option value="">Sem Item</option>
            {items.map(item => (
              <option key={item.name} value={item.name}>{item.name.replace(/-/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <select
            key={i}
            value={(pokemon.moves && pokemon.moves[i]) || ''}
            onChange={(e) => {
              const newMoves = pokemon.moves ? [...pokemon.moves] : ['', '', '', ''];
              newMoves[i] = e.target.value;
              onChange({ ...pokemon, moves: newMoves });
            }}
            className="w-full bg-white border border-zinc-100 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wide outline-none focus:border-red-600 transition-all text-zinc-700 hover:bg-zinc-50"
          >
            <option value="">Selecionar Golpe...</option>
            {details.moves.map(m => (
              <option key={m.move.name} value={m.move.name}>{m.move.name.replace('-', ' ')}</option>
            ))}
          </select>
        ))}
      </div>
    </>
  );
}

function PokemonSelector({ onSelect, onClose }: { onSelect: (id: number) => void, onClose: () => void }) {
  const { pokemon } = usePokemonList();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(30);

  const filtered = pokemon.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search);
    const matchesType = selectedType ? p.types.includes(selectedType) : true;

    let matchesGen = true;
    if (selectedGen) {
      const gen = GENERATIONS.find(g => g.id === selectedGen);
      if (gen) {
        matchesGen = p.id >= gen.range[0] && p.id <= gen.range[1];
      }
    }

    return matchesSearch && matchesType && matchesGen;
  });

  const displayed = filtered.slice(0, displayCount);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-red-600 transition-colors" size={24} />
              <input
                autoFocus
                type="text"
                placeholder="Procurar Pokémon..."
                value={search}
                onChange={e => { setSearch(e.target.value); setDisplayCount(30); }}
                className="w-full bg-white pl-16 pr-8 py-5 rounded-3xl border-2 border-zinc-100 focus:border-red-600 outline-none text-xl font-black italic uppercase tracking-tighter transition-all"
              />
            </div>
            <button onClick={onClose} className="p-4 bg-zinc-100 text-zinc-400 hover:bg-red-600 hover:text-white rounded-full transition-all active:scale-90 flex items-center justify-center"><X size={28} /></button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <select
                value={selectedType || ''}
                onChange={e => { setSelectedType(e.target.value || null); setDisplayCount(30); }}
                className="w-full pl-6 pr-10 py-4 rounded-[1.5rem] border-2 border-zinc-100 bg-white focus:border-red-600 outline-none appearance-none font-black text-xs uppercase tracking-widest text-zinc-500 cursor-pointer transition-all"
              >
                <option value="">Todos os Tipos</option>
                {ALL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={20} className="text-zinc-300" />
              </div>
            </div>

            <div className="flex-1 relative">
              <select
                value={selectedGen || ''}
                onChange={e => { setSelectedGen(e.target.value ? Number(e.target.value) : null); setDisplayCount(30); }}
                className="w-full pl-6 pr-10 py-4 rounded-[1.5rem] border-2 border-zinc-100 bg-white focus:border-red-600 outline-none appearance-none font-black text-xs uppercase tracking-widest text-zinc-500 cursor-pointer transition-all"
              >
                <option value="">Todas as Gerações</option>
                {GENERATIONS.map(gen => (
                  <option key={gen.id} value={gen.id}>{gen.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={20} className="text-zinc-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/20">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-zinc-300">
              <Search size={64} className="mb-6 opacity-10" />
              <p className="text-2xl font-black uppercase italic tracking-tighter">Nenhum Pokémon encontrado</p>
              <p className="font-bold tracking-widest text-xs mt-2">Tente mudar os filtros ou a busca</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {displayed.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className="flex flex-col items-center p-6 bg-white rounded-[2rem] hover:ring-4 hover:ring-red-100 hover:border-red-400 border border-zinc-100 transition-all group scale-100 active:scale-95 shadow-sm hover:shadow-xl"
                  >
                    <img src={p.sprite} alt={p.name} className="w-20 h-20 object-contain mb-3 group-hover:scale-110 transition-transform" loading="lazy" />
                    <span className="font-black italic uppercase tracking-tighter text-zinc-800 text-sm truncate w-full text-center">{p.name.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
              {displayCount < filtered.length && (
                <div className="flex justify-center mt-12 mb-4">
                  <button
                    onClick={() => setDisplayCount(c => c + 30)}
                    className="flex items-center gap-3 bg-zinc-900 text-white px-10 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95"
                  >
                    Ver Mais Resultados
                    <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
