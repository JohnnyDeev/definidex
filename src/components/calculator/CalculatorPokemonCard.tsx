import React from 'react';
import { Sword, Shield, Zap, Heart, Activity, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import type { PokemonState } from '../../hooks/useDamageCalculator';
import { PokemonSelector, MoveSelector, StatSlider, Select, Toggle } from './CalculatorControls';
import { typeColors } from '../TypeBadge';

interface PokemonCardProps {
  side: 'attacker' | 'defender';
  pokemon: PokemonState;
  onChange: (updates: Partial<PokemonState>) => void;
  speciesList: string[];
  movesList: string[];
  itemsList: string[];
  abilitiesList: string[];
  getPokemonMoves: (species: string) => string[];
  generation: number;
}

const NATURES = [
  'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful',
  'Docile', 'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly',
  'Lax', 'Lonely', 'Mild', 'Modest', 'Naive', 'Naughty',
  'Quiet', 'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid'
];

const NATURE_BOOSTS: Record<string, { up?: string; down?: string }> = {
  Adamant: { up: 'atk', down: 'spa' },
  Bold: { up: 'def', down: 'atk' },
  Brave: { up: 'atk', down: 'spe' },
  Calm: { up: 'spd', down: 'atk' },
  Careful: { up: 'spd', down: 'spa' },
  Hasty: { up: 'spe', down: 'def' },
  Impish: { up: 'def', down: 'spa' },
  Jolly: { up: 'spe', down: 'spa' },
  Lax: { up: 'def', down: 'spd' },
  Lonely: { up: 'atk', down: 'def' },
  Mild: { up: 'spa', down: 'def' },
  Modest: { up: 'spa', down: 'atk' },
  Naive: { up: 'spe', down: 'spd' },
  Naughty: { up: 'atk', down: 'spd' },
  Quiet: { up: 'spa', down: 'spe' },
  Rash: { up: 'spa', down: 'spd' },
  Relaxed: { up: 'def', down: 'spe' },
  Sassy: { up: 'spd', down: 'spe' },
  Timid: { up: 'spe', down: 'atk' },
};

export function CalculatorPokemonCard({
  side,
  pokemon,
  onChange,
  speciesList,
  movesList,
  itemsList,
  abilitiesList,
  getPokemonMoves,
  generation,
}: PokemonCardProps) {
  const isAttacker = side === 'attacker';

  const pokemonMoves = pokemon.species ? getPokemonMoves(pokemon.species) : movesList;

  const getNatureColor = (stat: string) => {
    if (!pokemon.nature) return '';
    const nature = NATURE_BOOSTS[pokemon.nature];
    if (!nature) return '';
    if (nature.up === stat) return 'text-green-600 bg-green-50';
    if (nature.down === stat) return 'text-red-600 bg-red-50';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Species & Level */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <PokemonSelector
            value={pokemon.species}
            onChange={v => onChange({ species: v })}
            speciesList={speciesList}
            label={isAttacker ? 'Atacante' : 'Defensor'}
            placeholder="Buscar Pokémon..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            Nível
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={pokemon.level}
            onChange={e => onChange({ level: Math.max(1, Math.min(100, Number(e.target.value))) })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-sm font-bold text-center text-zinc-700"
          />
        </div>
      </div>

      {/* Item & Ability */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={pokemon.item || ''}
          onChange={v => onChange({ item: v || undefined })}
          options={itemsList.map(i => ({ value: i, label: i }))}
          placeholder="Item"
          label="Item"
        />
        <Select
          value={pokemon.ability || ''}
          onChange={v => onChange({ ability: v || undefined })}
          options={abilitiesList.map(a => ({ value: a, label: a }))}
          placeholder="Ability"
          label="Ability"
        />
      </div>

      {/* Nature */}
      <Select
        value={pokemon.nature}
        onChange={v => onChange({ nature: v as any })}
        options={NATURES.map(n => ({ value: n, label: n }))}
        placeholder="Nature"
        label="Nature"
      />

      {/* EVs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-red-500" />
          <span className="text-xs font-black text-zinc-600 uppercase tracking-wider">EVs</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatSlider
            label="HP"
            value={pokemon.evs.hp}
            onChange={v => onChange({ evs: { ...pokemon.evs, hp: v } })}
            color="red"
          />
          <StatSlider
            label="ATK"
            value={pokemon.evs.atk}
            onChange={v => onChange({ evs: { ...pokemon.evs, atk: v } })}
            color="red"
          />
          <StatSlider
            label="DEF"
            value={pokemon.evs.def}
            onChange={v => onChange({ evs: { ...pokemon.evs, def: v } })}
            color="blue"
          />
          <StatSlider
            label="SPA"
            value={pokemon.evs.spa}
            onChange={v => onChange({ evs: { ...pokemon.evs, spa: v } })}
            color="blue"
          />
          <StatSlider
            label="SPD"
            value={pokemon.evs.spd}
            onChange={v => onChange({ evs: { ...pokemon.evs, spd: v } })}
            color="green"
          />
          <StatSlider
            label="SPE"
            value={pokemon.evs.spe}
            onChange={v => onChange({ evs: { ...pokemon.evs, spe: v } })}
            color="green"
          />
        </div>
      </div>

      {/* Move (only for attacker) */}
      {isAttacker && (
        <MoveSelector
          value={pokemon.selectedMove}
          onChange={v => onChange({ selectedMove: v as any })}
          movesList={pokemonMoves}
          label="Movimento"
          placeholder="Buscar movimento..."
        />
      )}

      {/* Status */}
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'Nenhum' },
            { value: 'psn', label: '🤢 Veneno' },
            { value: 'brn', label: '🔥 Queimado' },
            { value: 'frz', label: '❄️ Congelado' },
            { value: 'slp', label: '💤 Dormindo' },
            { value: 'par', label: '⚡ Paralisado' },
            { value: 'tox', label: '☠️ Tóxico' },
          ].map(status => (
            <button
              key={status.value}
              onClick={() => onChange({ status: status.value as any })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pokemon.status === status.value
                ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tera Type (Gen 9+) */}
      {generation >= 9 && (
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles size={14} className="text-yellow-500" />
            Tera Tipo
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
              'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
              'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
            ].map(type => (
              <button
                key={type}
                onClick={() => onChange({ teraType: type as any })}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${pokemon.teraType === type
                  ? `${typeColors[type as keyof typeof typeColors]?.split(' ')[0] || 'bg-zinc-500'} text-white shadow-md`
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamax */}
      {generation >= 8 && (
        <Toggle
          checked={pokemon.isDynamaxed || false}
          onChange={v => onChange({ isDynamaxed: v })}
          label="Dynamax"
          icon={<Star size={14} />}
        />
      )}
    </motion.div>
  );
}
