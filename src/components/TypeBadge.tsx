import React from 'react';

export const typeColors: Record<string, string> = {
  normal: 'bg-stone-400 text-white',
  fire: 'bg-red-500 text-white',
  water: 'bg-blue-500 text-white',
  electric: 'bg-yellow-400 text-zinc-900',
  grass: 'bg-green-500 text-white',
  ice: 'bg-cyan-300 text-zinc-900',
  fighting: 'bg-orange-700 text-white',
  poison: 'bg-purple-500 text-white',
  ground: 'bg-amber-600 text-white',
  flying: 'bg-indigo-300 text-zinc-900',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-zinc-900',
  rock: 'bg-yellow-700 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-700 text-white',
  dark: 'bg-zinc-800 text-white',
  steel: 'bg-slate-400 text-zinc-900',
  fairy: 'bg-pink-300 text-zinc-900',
};

export const typeHexColors: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

export const TypeBadge: React.FC<{ type: string, className?: string }> = ({ type, className }) => {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${typeColors[type] || 'bg-zinc-400 text-white'} ${className || ''}`}>
      {type}
    </span>
  );
};
