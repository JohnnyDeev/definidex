import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, TrendingUp, Target, Zap, Shield, AlertCircle } from 'lucide-react';
import type { Result } from '@smogon/calc';

interface DamageResultProps {
  result: Result | null;
  attackerName: string;
  defenderName: string;
}

export function DamageResult({ result, attackerName, defenderName }: DamageResultProps) {
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

  const koChance = useMemo(() => {
    if (!result || !damagePercent) return null;

    const rolls: { rolls: number; chance: number }[] = [];
    for (let i = 0; i <= 16; i++) {
      const damage = damageRange![0] + ((damageRange![1] - damageRange![0]) * i / 16);
      const percent = (damage / result!.defender.maxHP()) * 100;

      if (percent >= 100) {
        rolls.push({ rolls: 16 - i, chance: ((16 - i) / 16) * 100 });
        break;
      }
    }

    return rolls[0] || null;
  }, [result, damagePercent, damageRange]);

  const getDamageColor = (percent: number) => {
    if (percent < 25) return 'from-green-400 to-green-500';
    if (percent < 50) return 'from-yellow-400 to-yellow-500';
    if (percent < 75) return 'from-orange-400 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getDamageBarColor = (percent: number) => {
    if (percent < 25) return 'bg-green-500';
    if (percent < 50) return 'bg-yellow-500';
    if (percent < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!result || !damageRange || !damagePercent) {
    return (
      <div className="bg-gradient-to-br from-zinc-50 to-white rounded-2xl p-8 text-center border-2 border-dashed border-zinc-200">
        <Target size={48} className="mx-auto text-zinc-300 mb-3" />
        <p className="text-zinc-500 font-medium">
          Selecione um Pokémon, movimento e alvo para calcular o dano
        </p>
      </div>
    );
  }

  const isOHKO = damagePercent.min >= 100;
  const is2HKO = damagePercent.min >= 50;
  const is3HKO = damagePercent.min >= 33.3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Main Damage Display */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl shadow-red-500/25">
        <div className="text-center">
          <p className="text-red-100 text-xs font-bold uppercase tracking-widest mb-2">
            Dano Calculado
          </p>
          <div className="text-5xl font-black mb-2">
            {damageRange[0]} - {damageRange[1]}
          </div>
          <div className="text-red-100 text-sm font-medium">
            {damagePercent.min.toFixed(1)}% - {damagePercent.max.toFixed(1)}% do HP
          </div>
        </div>
      </div>

      {/* Damage Bar */}
      <div className="bg-white rounded-xl p-4 border-2 border-zinc-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Heart size={14} className="text-red-500" />
            Dano no HP
          </span>
          <span className="text-xs font-black text-zinc-700">
            {damagePercent.min.toFixed(1)}% - {damagePercent.max.toFixed(1)}%
          </span>
        </div>

        <div className="relative h-6 bg-zinc-100 rounded-full overflow-hidden">
          {/* Min damage */}
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getDamageColor(damagePercent.min)} transition-all duration-500`}
            style={{ width: `${Math.min(damagePercent.min, 100)}%` }}
          />
          {/* Max damage indicator */}
          {damagePercent.max > damagePercent.min && (
            <div
              className={`absolute top-0 h-full opacity-50 bg-gradient-to-r ${getDamageColor(damagePercent.max)}`}
              style={{
                left: `${Math.min(damagePercent.min, 100)}%`,
                width: `${Math.min(damagePercent.max - damagePercent.min, 100 - damagePercent.min)}%`
              }}
            />
          )}
          {/* 100% HP marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: '100%' }} />
        </div>

        {/* HP markers */}
        <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* KO Chances */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-4 border-2 ${isOHKO
            ? 'bg-green-50 border-green-200'
            : 'bg-zinc-50 border-zinc-200'
          }`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className={isOHKO ? 'text-green-600' : 'text-zinc-400'} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isOHKO ? 'text-green-600' : 'text-zinc-500'
              }`}>
              OHKO
            </span>
          </div>
          <p className={`text-sm font-black ${isOHKO ? 'text-green-700' : 'text-zinc-400'
            }`}>
            {isOHKO ? 'Sempre!' : 'Impossível'}
          </p>
        </div>

        <div className={`rounded-xl p-4 border-2 ${koChance
            ? 'bg-blue-50 border-blue-200'
            : 'bg-zinc-50 border-zinc-200'
          }`}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className={koChance ? 'text-blue-600' : 'text-zinc-400'} />
            <span className={`text-xs font-bold uppercase tracking-wider ${koChance ? 'text-blue-600' : 'text-zinc-500'
              }`}>
              Chance KO
            </span>
          </div>
          <p className={`text-sm font-black ${koChance ? 'text-blue-700' : 'text-zinc-400'
            }`}>
            {koChance ? `${koChance.chance.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Hit Chances */}
      <div className="bg-white rounded-xl p-4 border-2 border-zinc-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-purple-500" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Probabilidade de Dano
          </span>
        </div>

        <div className="space-y-2">
          {[100, 75, 50, 25].map(threshold => {
            const chance = damagePercent.max >= threshold
              ? Math.min(100, ((damagePercent.max - threshold) / (damagePercent.max - damagePercent.min || 1)) * 100)
              : 0;

            return (
              <div key={threshold} className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-500 w-16">
                  ≥{threshold}%
                </span>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getDamageBarColor(chance)} transition-all duration-300`}
                    style={{ width: `${chance}%` }}
                  />
                </div>
                <span className="text-xs font-black text-zinc-700 w-12 text-right">
                  {chance.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Battle Info */}
      <div className="bg-gradient-to-br from-zinc-50 to-white rounded-xl p-4 border-2 border-zinc-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-blue-500" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Informações da Batalha
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Movimento</span>
            <span className="font-bold text-zinc-700">{result.move.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Categoria</span>
            <span className={`font-bold ${result.move.category === 'Physical' ? 'text-orange-600' :
                result.move.category === 'Special' ? 'text-blue-600' :
                  'text-purple-600'
              }`}>
              {result.move.category || 'Status'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Poder Base</span>
            <span className="font-bold text-zinc-700">{result.move.bp || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Tipo</span>
            <span className="font-bold text-zinc-700">{result.move.type}</span>
          </div>
          {result.move.recoil && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Recoil</span>
              <span className="font-bold text-red-600">{result.move.recoil[0]}/{result.move.recoil[1]} ({result.move.recoil[0] / result.move.recoil[1] * 100}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {result.rawDesc && (
        <div className="bg-white rounded-xl p-4 border-2 border-zinc-200">
          <p className="text-sm text-zinc-600 leading-relaxed">
            {result.fullDesc()}
          </p>
        </div>
      )}
    </motion.div>
  );
}
