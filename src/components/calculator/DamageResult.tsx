import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, TrendingUp, Target, Zap, Shield, AlertCircle, Sword } from 'lucide-react';
import type { Result } from '@smogon/calc';

interface MoveResult {
  moveName: string;
  result: Result | null;
  index: number;
}

interface DamageResultProps {
  results: MoveResult[] | null;
  attackerName: string;
  defenderName: string;
}

export function DamageResult({ results, attackerName, defenderName }: DamageResultProps) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-50 to-white rounded-2xl p-8 text-center border-2 border-dashed border-zinc-200">
        <Target size={48} className="mx-auto text-zinc-300 mb-3" />
        <p className="text-zinc-500 font-medium">
          Selecione um Pokémon e pelo menos 1 movimento para calcular o dano
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map(({ moveName, result, index }) => (
        <MoveResultCard
          key={`${moveName}-${index}`}
          moveName={moveName}
          result={result}
          attackerName={attackerName}
          defenderName={defenderName}
          index={index}
        />
      ))}
    </div>
  );
}

interface MoveResultCardProps {
  moveName: string;
  result: Result | null;
  attackerName: string;
  defenderName: string;
  index: number;
}

function MoveResultCard({ moveName, result, attackerName, defenderName, index }: MoveResultCardProps) {
  const damageRange = useMemo(() => {
    if (!result) return null;
    return result.range();
  }, [result]);

  const damagePercent = useMemo(() => {
    if (!result || !damageRange) return null;
    const defenderMaxHP = result.defender.maxHP();
    return {
      min: (damageRange[0] / defenderMaxHP) * 100,
      max: (damageRange[1] / defenderMaxHP) * 100,
    };
  }, [result, damageRange]);

  const getDamageBarColor = (percent: number) => {
    if (percent < 25) return 'bg-green-500';
    if (percent < 50) return 'bg-yellow-500';
    if (percent < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!result || !damageRange || !damagePercent) {
    return null;
  }

  const isOHKO = damagePercent.min >= 100;
  const is2HKO = damagePercent.min >= 50;
  const is3HKO = damagePercent.min >= 33.3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border-2 border-zinc-200 overflow-hidden"
    >
      {/* Move Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3 border-b border-zinc-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs">
          {index + 1}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-zinc-800">{moveName}</h3>
          <p className="text-[10px] text-zinc-500 font-medium">
            {result.move.category} • {result.move.type} • BP: {result.move.bp || '—'}
          </p>
        </div>
        {isOHKO && (
          <div className="px-3 py-1 bg-green-500 text-white text-xs font-black rounded-full shadow-lg shadow-green-500/30">
            OHKO!
          </div>
        )}
      </div>

      {/* Damage Range Display */}
      <div className="p-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black text-zinc-800">
            {damageRange[0]}-{damageRange[1]}
          </span>
          <span className="text-sm font-bold text-zinc-500">
            ({damagePercent.min.toFixed(1)}% - {damagePercent.max.toFixed(1)}%)
          </span>
        </div>

        {/* Damage Bar */}
        <div className="relative h-4 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${getDamageBarColor(damagePercent.min)} transition-all duration-500`}
            style={{ width: `${Math.min(damagePercent.min, 100)}%` }}
          />
          {damagePercent.max > damagePercent.min && (
            <div
              className={`absolute top-0 h-full opacity-40 ${getDamageBarColor(damagePercent.max)}`}
              style={{
                left: `${Math.min(damagePercent.min, 100)}%`,
                width: `${Math.min(damagePercent.max - damagePercent.min, 100 - damagePercent.min)}%`
              }}
            />
          )}
        </div>
      </div>

      {/* KO Info */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <div className={`rounded-lg p-2 text-center ${isOHKO ? 'bg-green-100' : 'bg-zinc-100'}`}>
          <p className="text-[10px] font-bold text-zinc-500 uppercase">OHKO</p>
          <p className={`text-xs font-black ${isOHKO ? 'text-green-700' : 'text-zinc-400'}`}>
            {isOHKO ? '✓' : '×'}
          </p>
        </div>
        <div className={`rounded-lg p-2 text-center ${is2HKO ? 'bg-green-100' : 'bg-zinc-100'}`}>
          <p className="text-[10px] font-bold text-zinc-500 uppercase">2HKO</p>
          <p className={`text-xs font-black ${is2HKO ? 'text-green-700' : 'text-zinc-400'}`}>
            {is2HKO ? '✓' : '×'}
          </p>
        </div>
        <div className={`rounded-lg p-2 text-center ${is3HKO ? 'bg-green-100' : 'bg-zinc-100'}`}>
          <p className="text-[10px] font-bold text-zinc-500 uppercase">3HKO</p>
          <p className={`text-xs font-black ${is3HKO ? 'text-green-700' : 'text-zinc-400'}`}>
            {is3HKO ? '✓' : '×'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
