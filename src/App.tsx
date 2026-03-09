import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ChevronDown, Layers, Users, Briefcase, Cherry, Globe, Menu, X, Book, LogIn, LogOut } from 'lucide-react';
import { usePokemonList } from './hooks/usePokemonList';
import { PokemonCard } from './components/PokemonCard';
import { PokemonModal } from './components/PokemonModal';
import { BasicPokemon } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { typeColors } from './components/TypeBadge';
import { TeamBuilder } from './components/TeamBuilder';
import { ItemsView } from './components/ItemsView';
import { BerriesView } from './components/BerriesView';
import { BattleView } from './components/BattleView';
import { CalculatorView } from './components/CalculatorView';
import { NewsView } from './components/NewsView';
import { TcgDeckBuilder } from './components/TcgDeckBuilder';
import { Calculator } from 'lucide-react';
import { ALL_TYPES, GENERATIONS } from './constants';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './pages/ProfilePage';
import { RankAvatar } from './components/RankAvatar';

type ViewType = 'news' | 'dex' | 'tcg' | 'teambuilder' | 'items' | 'berries' | 'battle' | 'calculator' | 'profile';

export default function App() {
  const { pokemon, loading, error } = usePokemonList();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [selectedPokemon, setSelectedPokemon] = useState<BasicPokemon | null>(null);
  const [displayCount, setDisplayCount] = useState(40);
  const [currentView, setCurrentView] = useState<ViewType>('news');
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, showAuthModal, setShowAuthModal, signOut } = useAuth();

  // fecha menu mobile ao mudar de tela
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  const filteredPokemon = useMemo(() => {
    return pokemon.filter(p => {
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
  }, [pokemon, search, selectedType, selectedGen]);

  const displayedPokemon = filteredPokemon.slice(0, displayCount);

  // reseta contador ao filtrar
  useMemo(() => {
    setDisplayCount(40);
  }, [search, selectedType, selectedGen]);

  return (
    <div className="min-h-screen font-sans text-zinc-900 selection:bg-red-200 selection:text-red-900">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('news')}>
            <div className="relative w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
              <div className="absolute top-1 left-1 w-3 h-3 bg-white/60 rounded-full blur-[1px]"></div>
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-blue-900/40 rounded-full blur-[2px]"></div>
              <div className="w-4 h-4 border-2 border-blue-300/50 rounded-full"></div>
            </div>

            <div className="flex gap-1 ml-1">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-red-800 shadow-inner" />
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-800 shadow-inner" />
              <div className="w-3 h-3 rounded-full bg-green-400 border border-green-800 shadow-inner" />
            </div>

            <div className="ml-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/30 shadow-sm">
              <h1 className="text-2xl font-black tracking-tighter italic drop-shadow-md flex items-center [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                <span className="text-white">Defini</span>
                <span className="text-red-400">D</span>
                <span className="text-yellow-400">E</span>
                <span className="text-green-400">X</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* Auth Button Group */}
            {user ? (
              <div className="flex items-center gap-2 bg-red-700 rounded-full p-1 border-2 border-white/20">
                <button
                  onClick={() => {
                    setSelectedProfileUid(user.uid);
                    setCurrentView('profile');
                  }}
                  className="flex items-center gap-2 pl-1 pr-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Ver Perfil"
                >
                  <RankAvatar
                    photoURL={user.photoURL}
                    displayName={user.displayName}
                    contributionCount={profile?.contributionCount || 0}
                    size="sm"
                  />
                  <span className="hidden sm:block text-white text-xs font-bold max-w-[80px] truncate leading-tight">
                    {user.displayName?.split(' ')[0] ?? user.email?.split('@')[0]}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 font-bold text-sm px-4 py-2 rounded-full transition-colors shadow-sm"
              >
                <LogIn size={16} />
                <span className="hidden sm:block">Entrar</span>
              </button>
            )}

            <div className="relative group">
              <button
                className="p-2 bg-red-800 hover:bg-red-700 rounded-2xl transition-all border-2 border-white/10 flex items-center gap-3 px-3 min-w-[50px] sm:min-w-[120px] justify-center"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="hidden sm:block text-white text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">
                  {isMobileMenuOpen ? 'Fechar' : 'Ferramentas'}
                </span>
                <div className="flex flex-col gap-[4px] items-center justify-center">
                  {isMobileMenuOpen ? (
                    <X size={20} className="text-white" />
                  ) : (
                    <>
                      <div className="w-5 h-[3px] bg-red-400 rounded-full" />
                      <div className="w-5 h-[3px] bg-yellow-400 rounded-full" />
                      <div className="w-5 h-[3px] bg-green-400 rounded-full" />
                    </>
                  )}
                </div>
              </button>

              {!isMobileMenuOpen && (
                <div className="absolute top-full right-0 mt-3 hidden group-hover:block z-50">
                  <div className="bg-white text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-red-100 whitespace-nowrap animate-bounce">
                    Explorar Ferramentas ✨
                  </div>
                </div>
              )}
            </div>

            <div className="hidden xs:flex ml-1 relative items-center bg-red-700 rounded-lg p-1 hover:bg-red-800 transition-colors">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as any)}
                className="bg-transparent text-white border-none outline-none rounded px-1 py-0.5 text-xs font-bold appearance-none cursor-pointer pr-4"
              >
                <option value="en" className="text-black">EN</option>
                <option value="es" className="text-black">ES</option>
                <option value="pt-BR" className="text-black">PT</option>
              </select>
              <ChevronDown size={12} className="text-white/70 absolute right-1 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Unified Navigation Menu (Overlay) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-700 border-t border-red-800 overflow-hidden shadow-xl"
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 p-6 gap-3">

                <button
                  onClick={() => setCurrentView('dex')}
                  className={`px-4 py-3 rounded-xl font-bold text-left transition-colors flex items-center gap-3 ${currentView === 'dex' ? 'bg-white text-red-600' : 'text-white hover:bg-red-800'}`}
                >
                  <Book size={20} />
                  {t.dex}
                </button>
                <button
                  onClick={() => setCurrentView('tcg')}
                  className={`px-4 py-3 rounded-xl font-bold text-left transition-colors flex items-center gap-3 ${currentView === 'tcg' ? 'bg-white text-red-600' : 'text-white hover:bg-red-800'}`}
                >
                  <Layers size={20} />
                  TCG
                </button>
                <button
                  onClick={() => setCurrentView('teambuilder')}
                  className={`px-4 py-3 rounded-xl font-bold text-left transition-colors flex items-center gap-3 ${currentView === 'teambuilder' ? 'bg-white text-red-600' : 'text-white hover:bg-red-800'}`}
                >
                  <Users size={20} />
                  {t.teamBuilder}
                </button>
                <button
                  onClick={() => setCurrentView('items')}
                  className={`px-4 py-3 rounded-xl font-bold text-left transition-colors flex items-center gap-3 ${currentView === 'items' ? 'bg-white text-red-600' : 'text-white hover:bg-red-800'}`}
                >
                  <Briefcase size={20} />
                  {t.items}
                </button>
                <button
                  onClick={() => setCurrentView('berries')}
                  className={`px-4 py-3 rounded-xl font-bold text-left transition-colors flex items-center gap-3 ${currentView === 'berries' ? 'bg-white text-red-600' : 'text-white hover:bg-red-800'}`}
                >
                  <Cherry size={20} />
                  {t.berries}
                </button>
                <button
                  onClick={() => setCurrentView('battle')}
                  className={`px-4 py-3 rounded-xl font-bold text-left transition-colors flex items-center gap-3 ${currentView === 'battle' ? 'bg-white text-red-600' : 'text-white hover:bg-red-800'}`}
                >
                  <Globe size={20} />
                  {t.battle || 'Battle'}
                </button>
                <button
                  onClick={() => setCurrentView('calculator')}
                  className={`px-4 py-3 rounded-xl font-bold text-left transition-colors flex items-center gap-3 ${currentView === 'calculator' ? 'bg-white text-red-600' : 'text-white hover:bg-red-800'}`}
                >
                  <Calculator size={20} />
                  {t.calculator || 'Calculadora'}
                </button>

                <div className="sm:col-span-2 md:col-span-4 mt-2 pt-4 border-t border-red-800/50 flex flex-wrap gap-2">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === 'en' ? 'bg-white text-red-600' : 'bg-red-800/50 text-white/70 hover:text-white hover:bg-red-800'}`}
                  >
                    ENGLISH
                  </button>
                  <button
                    onClick={() => setLanguage('pt-BR')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === 'pt-BR' ? 'bg-white text-red-600' : 'bg-red-800/50 text-white/70 hover:text-white hover:bg-red-800'}`}
                  >
                    PORTUGUÊS
                  </button>
                  <button
                    onClick={() => setLanguage('es')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === 'es' ? 'bg-white text-red-600' : 'bg-red-800/50 text-white/70 hover:text-white hover:bg-red-800'}`}
                  >
                    ESPAÑOL
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {currentView !== 'calculator' && currentView !== 'profile' && (
        <main className="max-w-7xl mx-auto px-4 py-8">
          {currentView === 'news' ? (
            <NewsView />
          ) : currentView === 'tcg' ? (
            <TcgDeckBuilder onNavigateToProfile={(uid) => {
              setSelectedProfileUid(uid);
              setCurrentView('profile');
            }} />
          ) : currentView === 'teambuilder' ? (
            <TeamBuilder onNavigateToProfile={(uid) => {
              setSelectedProfileUid(uid);
              setCurrentView('profile');
            }} />
          ) : currentView === 'items' ? (
            <ItemsView />
          ) : currentView === 'berries' ? (
            <BerriesView />
          ) : currentView === 'battle' ? (
            <BattleView />
          ) : (
            <>
              {/* Controls */}
              <div className="mb-8 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar todos os 1025 Pokemons"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-lg font-medium shadow-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                      <Filter size={18} />
                    </div>
                    <select
                      value={selectedType || ''}
                      onChange={e => setSelectedType(e.target.value || null)}
                      className="w-full pl-12 pr-10 py-3 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 outline-none appearance-none font-semibold text-zinc-700 capitalize shadow-sm cursor-pointer"
                    >
                      <option value="">{t.allTypes}</option>
                      {ALL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={18} className="text-zinc-400" />
                    </div>
                    {/* Color indicator for selected type */}
                    {selectedType && (
                      <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${typeColors[selectedType].split(' ')[0]}`} />
                    )}
                  </div>

                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                      <Layers size={18} />
                    </div>
                    <select
                      value={selectedGen || ''}
                      onChange={e => setSelectedGen(e.target.value ? Number(e.target.value) : null)}
                      className="w-full pl-12 pr-10 py-3 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 outline-none appearance-none font-semibold text-zinc-700 shadow-sm cursor-pointer"
                    >
                      <option value="">{t.allGenerations}</option>
                      {GENERATIONS.map(gen => (
                        <option key={gen.id} value={gen.id}>{gen.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={18} className="text-zinc-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-zinc-200 border-t-red-600 rounded-full animate-spin mb-4" />
                  <p className="text-zinc-500 font-medium animate-pulse">{t.loading}</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-200 max-w-lg mx-auto">
                  <p className="font-bold text-lg mb-2">Error loading data</p>
                  <p>{error}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {displayedPokemon.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min((i % 40) * 0.05, 0.5) }}
                      >
                        <PokemonCard pokemon={p} onClick={() => setSelectedPokemon(p)} />
                      </motion.div>
                    ))}
                  </div>

                  {filteredPokemon.length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-zinc-400 text-lg font-medium">{t.noPokemonFound}</p>
                    </div>
                  )}

                  {displayCount < filteredPokemon.length && (
                    <div className="flex justify-center mt-12 mb-8">
                      <button
                        onClick={() => setDisplayCount(c => c + 40)}
                        className="flex items-center gap-2 bg-white border-2 border-zinc-200 text-zinc-700 hover:border-red-500 hover:text-red-600 px-8 py-3 rounded-full font-bold transition-all shadow-sm hover:shadow-md"
                      >
                        {t.loadMore}
                        <ChevronDown size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      )}

      <footer className="max-w-7xl mx-auto px-4 py-8 mt-8 border-t border-zinc-200">
        <p className="text-zinc-500 text-xs text-center leading-relaxed">
          DefiniDEX é um projeto de fã, sem fins lucrativos, e não é afiliado, endossado ou apoiado pela Nintendo, Game Freak ou The Pokémon Company de nenhuma forma.
          Pokémon e os nomes dos personagens Pokémon são marcas registradas da Nintendo. Todas as imagens e dados relacionados a Pokémon são propriedade intelectual de seus respectivos donos.
          Este site utiliza a <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline font-medium">PokéAPI</a>.
        </p>
      </footer>

      {/* Pokemon Modal */}
      <AnimatePresence>
        {selectedPokemon && (
          <PokemonModal
            pokemon={selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
