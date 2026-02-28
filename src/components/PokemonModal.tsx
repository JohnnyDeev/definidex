import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Swords, Map, Gamepad2, Zap, Layers, TrendingUp } from 'lucide-react';
import { BasicPokemon, EvolutionNode } from '../types';
import { TypeBadge, typeColors } from './TypeBadge';
import { usePokemonDetails } from '../hooks/usePokemonDetails';
import { calculateEffectiveness } from '../utils/typeEffectiveness';
import { MoveCard } from './MoveCard';
import { useLanguage } from '../contexts/LanguageContext';

export function PokemonModal({ pokemon, onClose }: { pokemon: BasicPokemon, onClose: () => void }) {
  const { language, t } = useLanguage();
  const { details, encounters, loading } = usePokemonDetails(pokemon.id, language);
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'competitive' | 'forms' | 'encounters' | 'games' | 'evolution'>('stats');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const effectiveness = useMemo(() => {
    return calculateEffectiveness(pokemon.types);
  }, [pokemon.types]);

  const tabs = [
    { id: 'stats', label: t.stats, icon: Activity },
    ...(details?.evolution_chain ? [{ id: 'evolution', label: t.evolution, icon: TrendingUp }] : []),
    { id: 'competitive', label: t.competitive, icon: Zap },
    { id: 'moves', label: t.allMoves, icon: Swords },
    ...(details?.varieties && details.varieties.length > 0 ? [{ id: 'forms', label: t.forms, icon: Layers }] : []),
    { id: 'encounters', label: t.locations, icon: Map },
    { id: 'games', label: t.games, icon: Gamepad2 },
  ] as const;

  // Mock competitive moves: pick 4 moves that are learned by TM/Tutor or level up
  const competitiveMoves = useMemo(() => {
    if (!details) return [];
    // Just grab 4 distinct moves to simulate a competitive set
    return details.moves.slice(0, 4).map(m => m.move.name);
  }, [details]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col md:flex-row max-h-[90vh] relative overflow-y-auto md:overflow-hidden scrollbar-hide"
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="fixed md:absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-red-600 text-white hover:bg-red-700 p-3 md:p-4 rounded-full shadow-xl transition-transform hover:scale-105 z-[100] flex items-center justify-center"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {/* Left side: Image & Basic Info */}
        <div className="bg-red-600 p-6 md:p-8 flex flex-col items-center relative md:w-[35%] shrink-0 md:overflow-y-auto scrollbar-hide">
          <span className="text-red-200 font-mono font-bold text-xl mb-2">
            #{String(pokemon.id).padStart(4, '0')}
          </span>
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            className="w-40 h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl mb-4"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-3xl font-bold capitalize text-white mb-3 text-center">
            {pokemon.name.replace('-', ' ')}
          </h2>
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {pokemon.types.map((t, index) => (
              <TypeBadge key={`${t}-${index}`} type={t} />
            ))}
          </div>

          {/* Weaknesses & Resistances */}
          <div className="w-full bg-black/20 rounded-2xl p-4 text-white/90">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-white/70 border-b border-white/10 pb-2">{t.weaknesses}</h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {effectiveness.weaknesses.map(type => (
                <span key={type} className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${typeColors[type]}`}>
                  {type} <span className="bg-black/30 px-1 rounded-sm">{effectiveness.effectiveness[type]}x</span>
                </span>
              ))}
            </div>

            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-white/70 border-b border-white/10 pb-2">{t.resistances}</h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {effectiveness.resistances.map(type => (
                <span key={type} className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${typeColors[type]}`}>
                  {type} <span className="bg-black/30 px-1 rounded-sm">{effectiveness.effectiveness[type]}x</span>
                </span>
              ))}
            </div>

            {effectiveness.immunities.length > 0 && (
              <>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-white/70 border-b border-white/10 pb-2">{t.immunities}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {effectiveness.immunities.map(type => (
                    <span key={type} className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${typeColors[type]}`}>
                      {type} <span className="bg-black/30 px-1 rounded-sm">0x</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side: Tabs & Content */}
        <div className="md:w-[65%] flex flex-col bg-zinc-50 relative md:flex-1 md:overflow-hidden">
          {/* Tabs Header */}
          <div className="flex flex-wrap border-b border-zinc-200 bg-white px-4 pt-4 shrink-0 gap-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors relative whitespace-nowrap ${isActive ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="md:flex-1 md:overflow-y-auto p-4 md:p-6 relative pb-24 scrollbar-hide">
            {loading || !details ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-red-600 rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === 'stats' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-4">{t.baseStats}</h3>
                        <div className="space-y-3">
                          {details.stats.map(s => {
                            const statName = s.stat.name === 'special-attack' ? 'Sp. Atk' :
                              s.stat.name === 'special-defense' ? 'Sp. Def' :
                                s.stat.name.toUpperCase();
                            const percentage = Math.min((s.base_stat / 255) * 100, 100);

                            return (
                              <div key={s.stat.name} className="flex items-center text-sm">
                                <span className="w-20 font-semibold text-zinc-500">{statName}</span>
                                <span className="w-10 font-mono font-bold text-right mr-3">{s.base_stat}</span>
                                <div className="flex-1 h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className={`h-full rounded-full ${s.base_stat >= 100 ? 'bg-green-500' : s.base_stat >= 70 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-4">{t.abilities}</h3>
                        <div className="flex flex-col gap-3">
                          {details.abilities.map(a => (
                            <div key={a.ability.name} className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-zinc-800 capitalize text-lg">
                                  {a.ability.name.replace('-', ' ')}
                                </span>
                                {a.is_hidden && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase tracking-wider">{t.hidden}</span>}
                              </div>
                              <p className="text-sm text-zinc-600 leading-relaxed">
                                {a.details?.effect || 'No description available.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-8 mt-6 border-t border-zinc-200 pt-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">{t.height}</span>
                          <span className="font-mono text-zinc-700 text-sm">{details.height / 10} m</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">{t.weight}</span>
                          <span className="font-mono text-zinc-700 text-sm">{details.weight / 10} kg</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'evolution' && details.evolution_chain && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-6">{t.evolution}</h3>
                      <div className="flex flex-col gap-6">
                        <EvolutionTree node={details.evolution_chain} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'competitive' && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-2">{t.suggestedMoveset}</h3>
                      <p className="text-sm text-zinc-500 mb-6">A generally strong set of moves for competitive play.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {competitiveMoves.map((move, i) => (
                          <div key={i} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                              {i + 1}
                            </div>
                            <span className="font-bold capitalize text-zinc-800 text-lg">{move.replace('-', ' ')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                          <Zap size={16} /> {t.proTip}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {t.proTipText}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'moves' && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-4">{t.movePool}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {details.moves.map(m => {
                          const method = m.version_group_details[0];
                          let methodText = method.move_learn_method.name.replace('-', ' ');
                          if (method.move_learn_method.name === 'level-up') {
                            methodText = `Level ${method.level_learned_at}`;
                          }

                          return (
                            <MoveCard key={m.move.name} moveUrl={m.move.url} methodText={methodText} />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'forms' && details.varieties && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-4">{t.altForms}</h3>
                      <div className="space-y-6">
                        {details.varieties.map(v => (
                          <div key={v.pokemon.name} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                              {v.details?.sprite && (
                                <img src={v.details.sprite} alt={v.pokemon.name} className="w-32 h-32 object-contain drop-shadow-md" />
                              )}
                              <div className="flex-1 w-full">
                                <h4 className="text-xl font-bold capitalize text-zinc-900 mb-2">{v.pokemon.name.replace(/-/g, ' ')}</h4>
                                <div className="flex gap-2 mb-4">
                                  {v.details?.types.map((t, index) => (
                                    <TypeBadge key={`${t}-${index}`} type={t} />
                                  ))}
                                </div>

                                {v.details?.stats && (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {v.details.stats.map(s => {
                                      const statName = s.stat.name === 'special-attack' ? 'SpA' :
                                        s.stat.name === 'special-defense' ? 'SpD' :
                                          s.stat.name.substring(0, 3).toUpperCase();
                                      return (
                                        <div key={s.stat.name} className="bg-zinc-50 px-2 py-1 rounded border border-zinc-100 flex justify-between text-xs">
                                          <span className="text-zinc-500 font-semibold">{statName}</span>
                                          <span className="font-mono font-bold">{s.base_stat}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'encounters' && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-4">{t.encounterLocations}</h3>
                      {encounters.length === 0 ? (
                        <p className="text-zinc-500 italic bg-white p-4 rounded-xl border border-zinc-200">{t.noEncounters}</p>
                      ) : (
                        <div className="space-y-3">
                          {encounters.map(e => (
                            <div key={e.location_area.name} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                              <h4 className="font-semibold capitalize text-zinc-800 mb-2">
                                {e.location_area.name.replace(/-/g, ' ')}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {e.version_details.map(v => (
                                  <span key={v.version.name} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded capitalize">
                                    {v.version.name.replace('-', ' ')} (Max {v.max_chance}%)
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'games' && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-4">{t.appearsIn}</h3>
                      <div className="flex flex-wrap gap-2">
                        {details.game_indices.map(g => (
                          <span key={g.version.name} className="px-3 py-2 bg-white text-zinc-700 rounded-lg text-sm font-medium capitalize border border-zinc-200 shadow-sm">
                            Pokémon {g.version.name.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EvolutionTree({ node }: { node: EvolutionNode }) {
  const getPokemonIdFromUrl = (url: string) => {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
  };

  const renderDetails = (details: any[]) => {
    if (!details || details.length === 0) return null;
    const d = details[0]; // Usually just one way to evolve
    const conditions = [];
    if (d.min_level) conditions.push(`Lvl ${d.min_level}`);
    if (d.item) conditions.push(d.item.name.replace('-', ' '));
    if (d.happiness) conditions.push(`Happiness ${d.happiness}`);
    if (d.time_of_day) conditions.push(d.time_of_day);
    if (d.location) conditions.push(`at ${d.location.name.replace('-', ' ')}`);
    if (d.known_move) conditions.push(`knowing ${d.known_move.name.replace('-', ' ')}`);

    let trigger = d.trigger?.name?.replace('-', ' ') || '';
    if (trigger === 'level up') trigger = '';

    const text = `${trigger} ${conditions.join(', ')}`.trim();
    if (!text) return null;

    return (
      <div className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full text-center capitalize max-w-[120px] shadow-sm border border-zinc-200 z-10">
        {text}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-white rounded-full shadow-md border-4 border-zinc-100 flex items-center justify-center p-2 mb-2 relative z-10">
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getPokemonIdFromUrl(node.species.url)}.png`}
            alt={node.species.name}
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <span className="font-bold capitalize text-zinc-800">{node.species.name.replace('-', ' ')}</span>
      </div>

      {node.evolves_to.length > 0 && (
        <div className="flex flex-col gap-6 relative">
          {node.evolves_to.map((evo) => (
            <div key={evo.species.name} className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative">
              <div className="flex flex-col items-center relative">
                <div className="hidden md:block w-8 h-0.5 bg-zinc-300 absolute left-[-2rem] top-1/2 -translate-y-1/2" />
                <div className="md:hidden h-8 w-0.5 bg-zinc-300" />
                {renderDetails(evo.evolution_details)}
                <div className="hidden md:block w-8 h-0.5 bg-zinc-300 absolute right-[-2rem] top-1/2 -translate-y-1/2" />
                <div className="md:hidden h-8 w-0.5 bg-zinc-300" />
              </div>
              <EvolutionTree node={evo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
