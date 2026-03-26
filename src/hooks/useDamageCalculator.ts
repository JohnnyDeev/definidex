import { useState, useCallback, useMemo } from 'react';
import { calculate, Pokemon, Move, Field, Generations, SPECIES, MOVES, ITEMS, ABILITIES } from '@smogon/calc';
import type { GenerationNum, StatsTable } from '@smogon/calc';

export interface PokemonState {
  species: string;
  level: number;
  nature: string;
  ability?: string;
  item?: string;
  ivs: StatsTable;
  evs: StatsTable;
  boosts: StatsTable;
  status: string;
  teraType?: string;
  isDynamaxed?: boolean;
  moves: string[];
  selectedMove?: string;
}

export interface FieldState {
  weather: 'Sun' | 'Rain' | 'Sand' | 'Hail' | 'Snow' | 'Harsh Sunshine' | 'Heavy Rain' | 'Strong Winds' | null;
  terrain: 'Electric' | 'Grassy' | 'Psychic' | 'Misty' | null;
  attackerSide: {
    isTailwind: boolean;
    isHelpingHand: boolean;
    isReflect: boolean;
    isLightScreen: boolean;
    isAuroraVeil: boolean;
    spikes: number;
    isSR: boolean;
  };
  defenderSide: {
    isTailwind: boolean;
    isHelpingHand: boolean;
    isReflect: boolean;
    isLightScreen: boolean;
    isAuroraVeil: boolean;
    spikes: number;
    isSR: boolean;
  };
}

const DEFAULT_STATS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const DEFAULT_IVS: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const DEFAULT_EVS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const DEFAULT_BOOSTS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

const DEFAULT_POKEMON: PokemonState = {
  species: '',
  level: 50,
  nature: 'Hardy',
  ivs: { ...DEFAULT_IVS },
  evs: { ...DEFAULT_EVS },
  boosts: { ...DEFAULT_BOOSTS },
  status: '',
  moves: [],
  selectedMove: undefined,
};

const DEFAULT_FIELD: FieldState = {
  weather: null,
  terrain: null,
  attackerSide: {
    isTailwind: false,
    isHelpingHand: false,
    isReflect: false,
    isLightScreen: false,
    isAuroraVeil: false,
    spikes: 0,
    isSR: false,
  },
  defenderSide: {
    isTailwind: false,
    isHelpingHand: false,
    isReflect: false,
    isLightScreen: false,
    isAuroraVeil: false,
    spikes: 0,
    isSR: false,
  },
};

export function useDamageCalculator() {
  const [generation, setGeneration] = useState<GenerationNum>(9);
  const [attacker, setAttacker] = useState<PokemonState>({ ...DEFAULT_POKEMON });
  const [defender, setDefender] = useState<PokemonState>({ ...DEFAULT_POKEMON });
  const [field, setField] = useState<FieldState>({ ...DEFAULT_FIELD });

  // Get all available species for selector - SPECIES[generation] contains species for that gen
  const speciesList = useMemo(() => {
    const genSpecies = (SPECIES as any)[generation] || (SPECIES as any)[9];
    return Object.keys(genSpecies).sort();
  }, [generation]);

  // Get all available moves for selector - MOVES[generation] contains moves for that gen
  const movesList = useMemo(() => {
    const genMoves = (MOVES as any)[generation] || (MOVES as any)[9];
    // MOVES values are objects with move names as keys
    return Object.keys(genMoves || {}).sort();
  }, [generation]);

  // Get all available items - ITEMS[generation] has numeric keys with item names as VALUES
  const itemsList = useMemo(() => {
    const genItems = (ITEMS as any)[generation] || (ITEMS as any)[9];
    // Items are stored as { '0': 'Item Name', '1': 'Another Item', ... }
    const items = Object.values(genItems || {}) as string[];
    return items.sort();
  }, [generation]);

  // Get all available abilities - ABILITIES[generation] has numeric keys with ability names as VALUES
  const abilitiesList = useMemo(() => {
    const genAbilities = (ABILITIES as any)[generation] || (ABILITIES as any)[9];
    // Abilities are stored as { '0': 'Ability Name', '1': 'Another Ability', ... }
    const abilities = Object.values(genAbilities || {}) as string[];
    return abilities.sort();
  }, [generation]);

  // Get moves for a specific Pokemon (simplified - returns all moves)
  const getPokemonMoves = useCallback((species: string): string[] => {
    if (!species) return movesList;
    return movesList;
  }, [movesList]);

  // Calculate damage
  const result = useMemo(() => {
    if (!attacker.species || !defender.species || !attacker.selectedMove) {
      return null;
    }

    try {
      const gen = Generations.get(generation);

      const attackerPokemon = new Pokemon(gen, attacker.species, {
        level: attacker.level,
        nature: attacker.nature,
        ability: attacker.ability,
        item: attacker.item,
        ivs: attacker.ivs,
        evs: attacker.evs,
        boosts: attacker.boosts,
        status: attacker.status as any,
        teraType: attacker.teraType as any,
        isDynamaxed: attacker.isDynamaxed,
      });

      const defenderPokemon = new Pokemon(gen, defender.species, {
        level: defender.level,
        nature: defender.nature,
        ability: defender.ability,
        item: defender.item,
        ivs: defender.ivs,
        evs: defender.evs,
        boosts: defender.boosts,
        status: defender.status as any,
        teraType: defender.teraType as any,
        isDynamaxed: defender.isDynamaxed,
      });

      const move = new Move(gen, attacker.selectedMove);

      const fieldObj = new Field({
        weather: field.weather || undefined,
        terrain: field.terrain || undefined,
        attackerSide: {
          isTailwind: field.attackerSide.isTailwind,
          isHelpingHand: field.attackerSide.isHelpingHand,
          isReflect: field.attackerSide.isReflect,
          isLightScreen: field.attackerSide.isLightScreen,
          isAuroraVeil: field.attackerSide.isAuroraVeil,
          spikes: field.attackerSide.spikes,
          isSR: field.attackerSide.isSR,
        },
        defenderSide: {
          isTailwind: field.defenderSide.isTailwind,
          isHelpingHand: field.defenderSide.isHelpingHand,
          isReflect: field.defenderSide.isReflect,
          isLightScreen: field.defenderSide.isLightScreen,
          isAuroraVeil: field.defenderSide.isAuroraVeil,
          spikes: field.defenderSide.spikes,
          isSR: field.defenderSide.isSR,
        },
      });

      return calculate(gen, attackerPokemon, defenderPokemon, move, fieldObj);
    } catch (error) {
      console.error('Error calculating damage:', error);
      return null;
    }
  }, [generation, attacker, defender, field]);

  // Update attacker
  const updateAttacker = useCallback((updates: Partial<PokemonState>) => {
    setAttacker(prev => ({ ...prev, ...updates }));
  }, []);

  // Update defender
  const updateDefender = useCallback((updates: Partial<PokemonState>) => {
    setDefender(prev => ({ ...prev, ...updates }));
  }, []);

  // Update field
  const updateField = useCallback((updates: Partial<FieldState>) => {
    setField(prev => ({ ...prev, ...updates }));
  }, []);

  // Update side conditions
  const updateSide = useCallback((side: 'attacker' | 'defender', updates: Partial<FieldState['attackerSide']>) => {
    setField(prev => ({
      ...prev,
      [side === 'attacker' ? 'attackerSide' : 'defenderSide']: {
        ...prev[side === 'attacker' ? 'attackerSide' : 'defenderSide'],
        ...updates,
      },
    }));
  }, []);

  // Swap attacker and defender
  const swapPokemon = useCallback(() => {
    setAttacker(defender);
    setDefender(attacker);
  }, [attacker, defender]);

  // Reset all
  const reset = useCallback(() => {
    setAttacker({ ...DEFAULT_POKEMON });
    setDefender({ ...DEFAULT_POKEMON });
    setField({ ...DEFAULT_FIELD });
  }, []);

  return {
    // State
    generation,
    attacker,
    defender,
    field,
    result,

    // Lists
    speciesList,
    movesList,
    itemsList,
    abilitiesList,

    // Actions
    setGeneration,
    updateAttacker,
    updateDefender,
    updateField,
    updateSide,
    getPokemonMoves,
    swapPokemon,
    reset,
  };
}
