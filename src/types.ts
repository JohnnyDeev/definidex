export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
  // Added for detailed view
  details?: {
    effect: string;
    short_effect: string;
  };
}

export interface BasicPokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
}

export interface PokemonMove {
  move: { name: string; url: string };
  version_group_details: {
    level_learned_at: number;
    move_learn_method: { name: string };
    version_group: { name: string };
  }[];
}

export interface PokemonGameIndex {
  game_index: number;
  version: { name: string };
}

export interface PokemonVariety {
  is_default: boolean;
  pokemon: {
    name: string;
    url: string;
  };
  details?: {
    types: string[];
    sprite: string;
    stats: PokemonStat[];
    abilities: PokemonAbility[];
  };
}

export interface EvolutionDetail {
  min_level: number | null;
  trigger: { name: string };
  item: { name: string } | null;
  happiness: number | null;
  time_of_day: string | null;
  location: { name: string } | null;
  known_move: { name: string } | null;
  known_move_type: { name: string } | null;
}

export interface EvolutionNode {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionNode[];
}

export interface DetailedPokemon extends BasicPokemon {
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  height: number;
  weight: number;
  moves: PokemonMove[];
  game_indices: PokemonGameIndex[];
  varieties: PokemonVariety[];
  evolution_chain?: EvolutionNode;
}

export interface PokemonEncounter {
  location_area: { name: string };
  version_details: {
    max_chance: number;
    version: { name: string };
  }[];
}

