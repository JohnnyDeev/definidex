import { motion } from 'motion/react';
import { BasicPokemon } from '../types';
import { TypeBadge, typeHexColors } from './TypeBadge';

export function PokemonCard({ pokemon, onClick }: { pokemon: BasicPokemon, onClick: () => void }) {
  const getGradient = () => {
    const colors = pokemon.types.map(t => typeHexColors[t] || '#A8A77A');
    if (colors.length === 1) {
      return `linear-gradient(135deg, ${colors[0]}22 0%, #ffffff 100%)`;
    }
    return `linear-gradient(135deg, ${colors[0]}22 0%, ${colors[1]}22 100%)`;
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ backgroundImage: getGradient() }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow cursor-pointer overflow-hidden border border-zinc-200 flex flex-col h-full"
    >
      <div className="p-4 flex justify-center items-center relative group h-48">
        <span className="absolute top-3 left-3 text-zinc-400 font-mono font-bold text-sm">
          #{String(pokemon.id).padStart(4, '0')}
        </span>
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          className="w-32 h-32 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
      <div className="p-4 border-t border-zinc-100 flex-1 flex flex-col items-center">
        <h2 className="text-lg font-bold capitalize text-zinc-900 mb-3">{pokemon.name.replace('-', ' ')}</h2>
        <div className="flex gap-2 flex-wrap justify-center">
          {pokemon.types.map((t, index) => (
            <TypeBadge key={`${t}-${index}`} type={t} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
