import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PokemonSelectorProps {
  value: string;
  onChange: (value: string) => void;
  speciesList: string[];
  placeholder?: string;
  label?: string;
}

export function PokemonSelector({
  value,
  onChange,
  speciesList,
  placeholder = 'Buscar Pokémon...',
  label,
}: PokemonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync search with external value when it changes (user selected a pokemon)
  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredSpecies = useMemo(() => {
    if (!search) return speciesList.slice(0, 50);
    return speciesList
      .filter(s => s.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 50);
  }, [search, speciesList]);

  const handleSelect = (species: string) => {
    onChange(species);
    setSearch(species);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            // Don't call onChange here - only call when user selects a pokemon
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-sm font-semibold text-zinc-700 placeholder-zinc-400"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />

        {search && (
          <button
            onClick={() => {
              onChange('');
              setSearch('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 max-h-80 overflow-hidden"
            style={{ zIndex: 99999 }}
          >
            <div
              className="absolute inset-0 z-[-1]"
              onClick={() => setIsOpen(false)}
            />
            <div className="overflow-y-auto max-h-72">
              {filteredSpecies.map(species => (
                <button
                  key={species}
                  onClick={() => {
                    handleSelect(species);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3 ${value === species ? 'bg-red-50 text-red-600 font-semibold' : 'text-zinc-700'
                    }`}
                >
                  <span className="flex-1">{species}</span>
                  {value === species && (
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </div>
            {filteredSpecies.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                Nenhum Pokémon encontrado
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MoveSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
  movesList: string[];
  placeholder?: string;
  label?: string;
}

export function MoveSelector({
  value,
  onChange,
  movesList,
  placeholder = 'Buscar movimento...',
  label,
}: MoveSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync search with external value when it changes (user selected a move)
  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredMoves = useMemo(() => {
    if (!search) return movesList.slice(0, 50);
    return movesList
      .filter(m => m.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 50);
  }, [search, movesList]);

  const handleSelect = (move: string) => {
    onChange(move);
    setSearch(move);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            // Don't call onChange here - only call when user selects a move
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-sm font-semibold text-zinc-700 placeholder-zinc-400"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />

        {search && (
          <button
            onClick={() => {
              onChange('');
              setSearch('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 max-h-80 overflow-hidden"
            style={{ zIndex: 99999 }}
          >
            <div className="overflow-y-auto max-h-72">
              {filteredMoves.map(move => (
                <button
                  key={move}
                  onClick={() => {
                    handleSelect(move);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3 ${value === move ? 'bg-red-50 text-red-600 font-semibold' : 'text-zinc-700'
                    }`}
                >
                  <span className="flex-1">{move}</span>
                  {value === move && (
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </div>
            {filteredMoves.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                Nenhum movimento encontrado
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StatSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  color?: 'red' | 'blue' | 'green';
}

export function StatSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 252,
  step = 4,
  color = 'red',
}: StatSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-black ${color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : 'text-green-600'}`}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer ${color === 'red' ? 'bg-red-100' : color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
          }`}
        style={{
          backgroundImage: `linear-gradient(to right, ${color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#22c55e'} 0%, ${color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#22c55e'} ${(value - min) / (max - min) * 100}%, ${color === 'red' ? '#fee2e2' : color === 'blue' ? '#dbeafe' : '#dcfce7'} ${(value - min) / (max - min) * 100}%, ${color === 'red' ? '#fee2e2' : color === 'blue' ? '#dbeafe' : '#dcfce7'} 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  label,
  className = '',
}: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-sm font-semibold text-zinc-700 appearance-none cursor-pointer"
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
      </div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: React.ReactNode;
}

export function Toggle({ checked, onChange, label, icon }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${checked
        ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
        }`}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function Card({ title, icon, children, className = '', headerAction }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-visible ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-50 to-white border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-black text-zinc-700 uppercase tracking-tight">{title}</h3>
        </div>
        {headerAction}
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}
