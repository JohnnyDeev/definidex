import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslatedEntry } from '../translations';
import { ptBRItemTranslations } from '../itemTranslations';

interface ItemDetail {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  cost: number;
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  flavor_text_entries: { text?: string; flavor_text?: string; language: { name: string } }[];
  sprites: { default: string };
  category: { name: string };
}

export function ItemsView() {
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(40);
  const { language, t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    const fetchItems = async () => {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/item?limit=1000');
        const data = await res.json();
        const details = await Promise.all(
          data.results.map((item: any) => fetch(item.url).then(r => r.json()))
        );
        if (mounted) {
          setItems(details);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) setLoading(false);
      }
    };
    fetchItems();
    return () => { mounted = false; };
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayedItems = filteredItems.slice(0, displayCount);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-zinc-200 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 font-medium animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder={t.searchItems}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-lg font-medium shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedItems.map(item => {
          const effectEntry = getTranslatedEntry(item.effect_entries, language);
          const flavorEntry = getTranslatedEntry(item.flavor_text_entries, language);
          const nameEntry = getTranslatedEntry(item.names, language);

          let description = flavorEntry?.flavor_text?.replace(/\n|\f/g, ' ') || flavorEntry?.text?.replace(/\n|\f/g, ' ') || effectEntry?.short_effect || 'No description available.';
          let displayName = item.name.replace(/-/g, ' ');

          if (language.startsWith('pt') && ptBRItemTranslations[item.name]) {
            description = ptBRItemTranslations[item.name].description;
          } else if (nameEntry?.name && !language.startsWith('pt')) {
            displayName = nameEntry.name;
          }

          return (
            <div key={item.name} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                  {item.sprites.default ? (
                    <img src={item.sprites.default} alt={item.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 bg-zinc-200 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 capitalize text-lg leading-tight">{displayName}</h3>
                  <span className="text-[10px] font-bold uppercase bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
                    {item.category.name.replace(/-/g, ' ')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed flex-1">
                {description}
              </p>
              {item.cost > 0 && (
                <div className="text-xs font-mono font-bold text-zinc-500 mt-2">
                  {t.cost}: ₽{item.cost}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayCount < filteredItems.length && (
        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={() => setDisplayCount(c => c + 40)}
            className="bg-white border-2 border-zinc-200 text-zinc-700 hover:border-red-500 hover:text-red-600 px-8 py-3 rounded-full font-bold transition-all shadow-sm"
          >
            {t.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
