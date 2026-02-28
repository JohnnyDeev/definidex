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

export const TypeBadge: React.FC<{ type: string, className?: string }> = ({ type, className }) => {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${typeColors[type] || 'bg-zinc-400 text-white'} ${className || ''}`}>
      {type}
    </span>
  );
};
