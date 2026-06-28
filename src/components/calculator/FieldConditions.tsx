import React from 'react';
import { Cloud, Droplet, Sun, Wind, Snowflake, Sparkles, Shield, Users, Swords } from 'lucide-react';
import { motion } from 'motion/react';
import type { FieldState } from '../../hooks/useDamageCalculator';
import { Toggle } from './CalculatorControls';

interface FieldConditionsProps {
  field: FieldState;
  onUpdate: (updates: Partial<FieldState>) => void;
  onUpdateSide: (side: 'attacker' | 'defender', updates: Partial<FieldState['attackerSide']>) => void;
}

export function FieldConditions({ field, onUpdate, onUpdateSide }: FieldConditionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Format Selector - Singles/Doubles */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Swords size={16} className="text-purple-600" />
          <span className="text-xs font-black text-purple-900 uppercase tracking-wider">
            Formato da Batalha
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onUpdate({ isDoubles: false })}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all ${!field.isDoubles
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-white text-zinc-600 border-2 border-zinc-200 hover:border-purple-300'
              }`}
          >
            🎯 Singles (1v1)
          </button>
          <button
            onClick={() => onUpdate({ isDoubles: true })}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all ${field.isDoubles
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white text-zinc-600 border-2 border-zinc-200 hover:border-blue-300'
              }`}
          >
            ⚔️ Doubles (2v2)
          </button>
        </div>
        {field.isDoubles && (
          <p className="text-[10px] text-blue-600 font-bold mt-2 text-center">
            🎮 VGC usa formato Doubles - Dano é reduzido em 25%
          </p>
        )}
      </div>

      {/* Weather */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Cloud size={16} className="text-blue-500" />
          <span className="text-xs font-black text-zinc-600 uppercase tracking-wider">Clima</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Toggle
            checked={field.weather === null}
            onChange={() => onUpdate({ weather: null })}
            label="Nenhum"
          />
          <Toggle
            checked={field.weather === 'Sun'}
            onChange={() => onUpdate({ weather: 'Sun' })}
            label="Sol"
            icon={<Sun size={14} />}
          />
          <Toggle
            checked={field.weather === 'Rain'}
            onChange={() => onUpdate({ weather: 'Rain' })}
            label="Chuva"
            icon={<Droplet size={14} />}
          />
          <Toggle
            checked={field.weather === 'Sand'}
            onChange={() => onUpdate({ weather: 'Sand' })}
            label="Areia"
            icon={<Wind size={14} />}
          />
          <Toggle
            checked={field.weather === 'Snow'}
            onChange={() => onUpdate({ weather: 'Snow' })}
            label="Neve"
            icon={<Snowflake size={14} />}
          />
        </div>
      </div>

      {/* Terrain */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          <span className="text-xs font-black text-zinc-600 uppercase tracking-wider">Terreno</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Toggle
            checked={field.terrain === null}
            onChange={() => onUpdate({ terrain: null })}
            label="Nenhum"
          />
          <Toggle
            checked={field.terrain === 'Electric'}
            onChange={() => onUpdate({ terrain: 'Electric' })}
            label="Elétrico"
            icon={<span className="text-sm">⚡</span>}
          />
          <Toggle
            checked={field.terrain === 'Grassy'}
            onChange={() => onUpdate({ terrain: 'Grassy' })}
            label="Grama"
            icon={<span className="text-sm">🌿</span>}
          />
          <Toggle
            checked={field.terrain === 'Psychic'}
            onChange={() => onUpdate({ terrain: 'Psychic' })}
            label="Psíquico"
            icon={<span className="text-sm">🔮</span>}
          />
          <Toggle
            checked={field.terrain === 'Misty'}
            onChange={() => onUpdate({ terrain: 'Misty' })}
            label="Neblina"
            icon={<span className="text-sm">🌫️</span>}
          />
        </div>
      </div>

      {/* Special Weather - Separated Section */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sun size={16} className="text-orange-600" />
          <span className="text-xs font-black text-orange-900 uppercase tracking-wider">
            ⚡ Weather Primordial (Abilities)
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Toggle
            checked={field.weather === 'Harsh Sunshine'}
            onChange={() => onUpdate({ weather: 'Harsh Sunshine' })}
            label="Sol Intenso"
            icon={<Sun size={14} />}
          />
          <Toggle
            checked={field.weather === 'Heavy Rain'}
            onChange={() => onUpdate({ weather: 'Heavy Rain' })}
            label="Chuva Forte"
            icon={<Droplet size={14} />}
          />
          <Toggle
            checked={field.weather === 'Strong Winds'}
            onChange={() => onUpdate({ weather: 'Strong Winds' })}
            label="Ventos Fortes"
            icon={<Wind size={14} />}
          />
        </div>
      </div>

      {/* Side Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attacker Side */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield size={16} className="text-red-500" />
            <span className="text-xs font-black text-zinc-600 uppercase tracking-wider">
              Lado do Atacante
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Toggle
              checked={field.attackerSide.isReflect}
              onChange={v => onUpdateSide('attacker', { isReflect: v })}
              label="Reflect"
            />
            <Toggle
              checked={field.attackerSide.isLightScreen}
              onChange={v => onUpdateSide('attacker', { isLightScreen: v })}
              label="Light Screen"
            />
            <Toggle
              checked={field.attackerSide.isAuroraVeil}
              onChange={v => onUpdateSide('attacker', { isAuroraVeil: v })}
              label="Aurora Veil"
            />
            <Toggle
              checked={field.attackerSide.isTailwind}
              onChange={v => onUpdateSide('attacker', { isTailwind: v })}
              label="Tailwind"
              icon={<Wind size={14} />}
            />
            <Toggle
              checked={field.attackerSide.isHelpingHand}
              onChange={v => onUpdateSide('attacker', { isHelpingHand: v })}
              label="Helping Hand"
              icon={<Users size={14} />}
            />
          </div>

          {/* Hazards */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Hazards</span>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => onUpdateSide('attacker', {
                  spikes: field.attackerSide.spikes >= 3 ? 0 : field.attackerSide.spikes + 1
                })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${field.attackerSide.spikes > 0
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                Spikes {field.attackerSide.spikes > 0 && `×${field.attackerSide.spikes}`}
              </button>
              <button
                onClick={() => onUpdateSide('attacker', { isSR: !field.attackerSide.isSR })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${field.attackerSide.isSR
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                Stealth Rock
              </button>
            </div>
          </div>
        </div>

        {/* Defender Side */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield size={16} className="text-blue-500" />
            <span className="text-xs font-black text-zinc-600 uppercase tracking-wider">
              Lado do Defensor
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Toggle
              checked={field.defenderSide.isReflect}
              onChange={v => onUpdateSide('defender', { isReflect: v })}
              label="Reflect"
            />
            <Toggle
              checked={field.defenderSide.isLightScreen}
              onChange={v => onUpdateSide('defender', { isLightScreen: v })}
              label="Light Screen"
            />
            <Toggle
              checked={field.defenderSide.isAuroraVeil}
              onChange={v => onUpdateSide('defender', { isAuroraVeil: v })}
              label="Aurora Veil"
            />
            <Toggle
              checked={field.defenderSide.isTailwind}
              onChange={v => onUpdateSide('defender', { isTailwind: v })}
              label="Tailwind"
              icon={<Wind size={14} />}
            />
            <Toggle
              checked={field.defenderSide.isHelpingHand}
              onChange={v => onUpdateSide('defender', { isHelpingHand: v })}
              label="Helping Hand"
              icon={<Users size={14} />}
            />
          </div>

          {/* Hazards */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Hazards</span>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => onUpdateSide('defender', {
                  spikes: field.defenderSide.spikes >= 3 ? 0 : field.defenderSide.spikes + 1
                })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${field.defenderSide.spikes > 0
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                Spikes {field.defenderSide.spikes > 0 && `×${field.defenderSide.spikes}`}
              </button>
              <button
                onClick={() => onUpdateSide('defender', { isSR: !field.defenderSide.isSR })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${field.defenderSide.isSR
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                Stealth Rock
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
