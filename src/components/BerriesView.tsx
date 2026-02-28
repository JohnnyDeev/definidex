import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BerryDetail {
  id: number;
  name: string;
  growth_time: number;
  max_harvest: number;
  size: number;
  smoothness: number;
  soil_dryness: number;
  firmness: { name: string };
  flavors: { flavor: { name: string }, potency: number }[];
  item: { url: string };
}

export function BerriesView() {
  const [berries, setBerries] = useState<BerryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(40);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    const fetchBerries = async () => {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/berry?limit=100');
        const data = await res.json();
        const details = await Promise.all(
          data.results.map((berry: any) => fetch(berry.url).then(r => r.json()))
        );
        if (mounted) {
          setBerries(details);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) setLoading(false);
      }
    };
    fetchBerries();
    return () => { mounted = false; };
  }, []);

  const filteredBerries = berries.filter(berry =>
    berry.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayedBerries = filteredBerries.slice(0, displayCount);

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
            placeholder={t.searchBerries}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-lg font-medium shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedBerries.map(berry => (
          <div key={berry.name} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${berry.name}-berry.png`}
                  alt={berry.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-zinc-800 capitalize text-lg leading-tight">{berry.name} Berry</h3>
                <span className="text-[10px] font-bold uppercase bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
                  {berry.firmness.name.replace(/-/g, ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-500">
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100 flex flex-col">
                <span className="uppercase font-bold text-[10px] text-zinc-400">{t.growthTime}</span>
                <span className="text-zinc-800 font-bold">{berry.growth_time}h</span>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100 flex flex-col">
                <span className="uppercase font-bold text-[10px] text-zinc-400">{t.maxHarvest}</span>
                <span className="text-zinc-800 font-bold">{berry.max_harvest}</span>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100 flex flex-col">
                <span className="uppercase font-bold text-[10px] text-zinc-400">{t.size}</span>
                <span className="text-zinc-800 font-bold">{berry.size / 10} cm</span>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100 flex flex-col">
                <span className="uppercase font-bold text-[10px] text-zinc-400">{t.smoothness}</span>
                <span className="text-zinc-800 font-bold">{berry.smoothness}%</span>
              </div>
            </div>

            <div className="mt-2">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">{t.flavors}</span>
              <div className="flex flex-wrap gap-1">
                {berry.flavors.filter(f => f.potency > 0).map(f => (
                  <span key={f.flavor.name} className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded capitalize border border-red-100">
                    {f.flavor.name} ({f.potency})
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayCount < filteredBerries.length && (
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
