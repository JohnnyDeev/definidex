import React, { useState, useRef } from 'react';
import { useTeamStore, Team, TeamPokemon } from '../hooks/useTeamStore';
import { BasicPokemon } from '../types';
import { Plus, Trash2, Save, X, Search, Download, Upload, Filter, Layers, ChevronDown } from 'lucide-react';
import { usePokemonList } from '../hooks/usePokemonList';
import { usePokemonDetails } from '../hooks/usePokemonDetails';
import { useItemsList } from '../hooks/useItemsList';
import { ALL_TYPES, GENERATIONS } from '../constants';
import { typeColors } from './TypeBadge';
import { VGCStats } from './VGCStats';

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
      // In a real app, we'd need to resolve the name to an ID. 
      // For this prototype, we'll use a placeholder or the name itself if the hook supports it.
      // But since we need an ID for PokeAPI, we'll try to guess or use 0.
      pokemonId: 0,
      item,
      moves: moves.slice(0, 4)
    };
  } catch (e) {
    return null;
  }
}

export function TeamBuilder() {
  const { user, teams, login, logout, saveTeam, deleteTeam, importTeams } = useTeamStore();
  const [usernameInput, setUsernameInput] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!teams || teams.length === 0) return;

    let showdownText = '';
    const currentTeam = editingTeam || teams[0];

    currentTeam.pokemons.forEach(p => {
      const pokemonName = p.pokemonId.toString(); // Fallback to ID if name not found in editor
      // Note: Real name fetching would happen here if we had synchronous access to all names
      // For now we'll format what we have:
      showdownText += `${p.pokemonId}\n`;
      if (p.item) showdownText += `Item: ${p.item}\n`;
      p.moves.forEach(m => {
        if (m) showdownText += `- ${m}\n`;
      });
      showdownText += '\n';
    });

    navigator.clipboard.writeText(showdownText);
    alert('Time copiado no formato Showdown! Cole no Teambuilder do Showdown.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          importTeams(imported);
          alert('Times importados com sucesso!');
        }
      } catch (err) {
        alert('Erro ao importar arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-white p-8 rounded-3xl shadow-md max-w-md w-full text-center border border-zinc-200">
          <h2 className="text-2xl font-bold mb-2">Qual o seu nome?</h2>
          <p className="text-zinc-500 mb-6">Identifique-se para criar e salvar seus times competitivos.</p>
          <input
            type="text"
            placeholder="Seu nome..."
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 mb-4 focus:border-red-500 outline-none font-medium text-lg"
            onKeyDown={e => e.key === 'Enter' && usernameInput.trim() && login(usernameInput.trim())}
          />
          <button
            onClick={() => usernameInput.trim() && login(usernameInput.trim())}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-lg"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8 mt-2">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Your Teams</h2>
          <p className="text-zinc-500">Logged in as <span className="font-bold text-zinc-800">{user.username}</span></p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-700 px-4 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors text-sm"
            title="Importar Times"
          >
            <Upload size={18} /> Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-700 px-4 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors text-sm"
            title="Exportar Times"
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => setEditingTeam({ id: Date.now().toString(), name: 'New Team', pokemons: [] })}
            className="col-span-2 sm:col-auto bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Plus size={20} /> Create Team
          </button>
          <button
            onClick={logout}
            className="col-span-2 sm:col-auto bg-zinc-50 text-zinc-400 px-6 py-2 rounded-xl font-bold hover:bg-zinc-100 transition-colors text-xs sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 order-2 lg:order-1">
          {editingTeam ? (
            <TeamEditor
              team={editingTeam}
              onSave={(t) => { saveTeam(t); setEditingTeam(null); }}
              onCancel={() => setEditingTeam(null)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-zinc-200 border-dashed">
                  <p className="text-zinc-400 text-lg font-medium">You haven't created any teams yet.</p>
                </div>
              ) : (
                teams.map(team => (
                  <div key={team.id} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">{team.name}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingTeam(team)} className="text-blue-500 hover:text-blue-700 font-medium text-sm">Edit</button>
                        <button onClick={() => deleteTeam(team.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {team.pokemons.map((p, i) => (
                        <div key={i} className="aspect-square bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-center overflow-hidden relative">
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`}
                            alt="pokemon"
                            className="w-full h-full object-contain"
                          />
                          {p.item && (
                            <div className="absolute bottom-0 right-0 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-lg border border-zinc-200 flex items-center justify-center p-1 shadow-md z-10">
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
                        <div key={`empty-${i}`} className="aspect-square bg-zinc-50 rounded-xl border border-zinc-200 border-dashed" />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="lg:w-80 order-1 lg:order-2">
          <VGCStats onSelect={(pokemonData) => {
            const newPokemon = {
              pokemonId: pokemonData.id,
              moves: pokemonData.moves,
              item: pokemonData.item
            };

            if (!editingTeam) {
              setEditingTeam({
                id: Date.now().toString(),
                name: 'New Team',
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
        </div>
      </div>
    </div>
  );
}

function TeamEditor({ team, onSave, onCancel }: { team: Team, onSave: (t: Team) => void, onCancel: () => void }) {
  const [name, setName] = useState(team.name);
  const [pokemons, setPokemons] = useState<TeamPokemon[]>(team.pokemons);
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);
  const [pendingPaste, setPendingPaste] = useState<Partial<TeamPokemon> | null>(null);

  // Sync with external updates (like VGC selection)
  React.useEffect(() => {
    if (team.pokemons.length !== pokemons.length) {
      setPokemons(team.pokemons);
    }
  }, [team.pokemons]);

  const handleSave = () => {
    onSave({ ...team, name, pokemons });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-zinc-200 focus:border-red-500 outline-none px-2 py-1 w-full"
        />
        <div className="flex gap-2 sm:gap-3 shrink-0">
          <button onClick={onCancel} className="flex-1 sm:flex-none px-4 py-2 text-zinc-500 hover:bg-zinc-100 rounded-xl font-medium transition-colors border border-zinc-200 sm:border-transparent">Cancel</button>
          <button onClick={handleSave} className="flex-1 sm:flex-none px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
            <Save size={18} /> Save Team
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => {
            const text = prompt('Cole o texto do Showdown aqui (Ex: Miraidon @ Choice Specs...):');
            if (text) {
              const imported = parseShowdown(text);
              if (imported) {
                setPendingPaste(imported);
                alert('Pronto! Agora clique em um slot vazio (+) para aplicar este set.');
              } else {
                alert('Não foi possível detectar o Pokémon. Verifique se o formato está correto.');
              }
            }
          }}
          className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2"
        >
          <Upload size={14} /> Paste from Showdown
        </button>
        {pendingPaste && (
          <button
            onClick={() => setPendingPaste(null)}
            className="text-xs font-bold text-zinc-400 hover:text-red-500 px-2 flex items-center gap-1"
          >
            <X size={14} /> Cancel Paste
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => {
          const p = pokemons[i];
          return (
            <div key={i} className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 relative min-h-[200px] flex flex-col group/slot">
              {pendingPaste && !p && (
                <button
                  onClick={() => {
                    setSelectingSlot(i);
                    // The actual application of moves/item will happen in PokemonSelector onSelect
                  }}
                  className="absolute inset-0 z-20 bg-red-600/10 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center border-2 border-red-500 border-dashed animate-pulse"
                >
                  <Plus size={32} className="text-red-600 mb-2" />
                  <span className="text-red-600 font-bold text-sm">Apply Pasted Set</span>
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
                  className="flex-1 flex flex-col items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-xl border-2 border-dashed border-zinc-300 hover:border-red-300"
                >
                  <Plus size={32} className="mb-2" />
                  <span className="font-semibold">Add Pokémon</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectingSlot !== null && (
        <PokemonSelector
          onSelect={(id) => {
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

  if (!details) return <div className="animate-pulse flex-1 bg-zinc-200 rounded-xl" />;

  const selectedItemData = items.find(i => i.name === pokemon.item);

  return (
    <>
      <button onClick={onRemove} className="absolute top-3 right-3 text-zinc-400 hover:text-red-500">
        <X size={20} />
      </button>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <img src={details.sprite} alt={details.name} className="w-16 h-16 object-contain drop-shadow-md" />
          {pokemon.item && (
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl border border-zinc-200 flex items-center justify-center p-1.5 shadow-md z-10">
              <img
                src={selectedItemData?.id
                  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${selectedItemData.id}.png`
                  : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${pokemon.item}.png`
                }
                alt={pokemon.item}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
                }}
              />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-bold capitalize text-lg leading-tight mb-1">{details.name.replace('-', ' ')}</h4>
          <div className="flex gap-1 mb-2">
            {details.types.map(t => (
              <span key={t} className="text-[10px] font-bold uppercase bg-zinc-200 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
          <select
            value={pokemon.item || ''}
            onChange={(e) => onChange({ ...pokemon, item: e.target.value })}
            className="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs outline-none focus:border-red-500 capitalize text-zinc-600"
          >
            <option value="">No Item</option>
            {items.map(item => (
              <option key={item.name} value={item.name}>{item.name.replace(/-/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <select
            key={i}
            value={(pokemon.moves && pokemon.moves[i]) || ''}
            onChange={(e) => {
              const newMoves = pokemon.moves ? [...pokemon.moves] : ['', '', '', ''];
              newMoves[i] = e.target.value;
              onChange({ ...pokemon, moves: newMoves });
            }}
            className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-500 capitalize"
          >
            <option value="">Select Move...</option>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-200 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Search className="text-zinc-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search Pokémon..."
              value={search}
              onChange={e => { setSearch(e.target.value); setDisplayCount(30); }}
              className="flex-1 outline-none text-lg"
            />
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full"><X size={20} /></button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <Filter size={16} />
              </div>
              <select
                value={selectedType || ''}
                onChange={e => { setSelectedType(e.target.value || null); setDisplayCount(30); }}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:border-red-500 outline-none appearance-none font-medium text-sm text-zinc-700 capitalize cursor-pointer transition-all"
              >
                <option value="">All Types</option>
                {ALL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={16} className="text-zinc-400" />
              </div>
              {selectedType && (
                <div className={`absolute right-8 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${typeColors[selectedType].split(' ')[0]}`} />
              )}
            </div>

            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <Layers size={16} />
              </div>
              <select
                value={selectedGen || ''}
                onChange={e => { setSelectedGen(e.target.value ? Number(e.target.value) : null); setDisplayCount(30); }}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:border-red-500 outline-none appearance-none font-medium text-sm text-zinc-700 cursor-pointer transition-all"
              >
                <option value="">All Generations</option>
                {GENERATIONS.map(gen => (
                  <option key={gen.id} value={gen.id}>{gen.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={16} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {(!search && !selectedType && !selectedGen) ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-10">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Search or filter to find Pokémon</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 font-medium">No Pokémon found.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {displayed.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className="flex flex-col items-center p-4 bg-zinc-50 rounded-xl hover:bg-red-50 hover:border-red-200 border border-zinc-100 transition-colors"
                  >
                    <img src={p.sprite} alt={p.name} className="w-16 h-16 object-contain mb-2" loading="lazy" />
                    <span className="font-semibold capitalize text-sm">{p.name.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
              {displayCount < filtered.length && (
                <div className="flex justify-center mt-6 mb-2">
                  <button
                    onClick={() => setDisplayCount(c => c + 30)}
                    className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 hover:border-red-500 hover:text-red-600 px-6 py-2 rounded-full font-bold transition-all shadow-sm"
                  >
                    Load More
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
