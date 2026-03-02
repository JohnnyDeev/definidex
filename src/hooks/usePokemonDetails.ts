import { useState, useEffect } from 'react';
import { DetailedPokemon, PokemonEncounter, PokemonVariety, PokemonAbility, EvolutionNode } from '../types';

export function usePokemonDetails(id: number | null, language: string = 'en') {
  const [details, setDetails] = useState<DetailedPokemon | null>(null);
  const [encounters, setEncounters] = useState<PokemonEncounter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setDetails(null);
      setEncounters([]);
      return;
    }

    let isMounted = true;

    async function fetchDetails() {
      setLoading(true);
      try {
        const [pRes, eRes, sRes] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).catch(() => null)
        ]);

        const pData = await pRes.json();
        const eData = await eRes.json();
        let varieties: PokemonVariety[] = [];
        let evolutionChain: EvolutionNode | undefined = undefined;

        if (sRes && sRes.ok) {
          const sData = await sRes.json();
          const nonDefaultVarieties = sData.varieties.filter((v: any) => !v.is_default);

          if (sData.evolution_chain?.url) {
            try {
              const evoRes = await fetch(sData.evolution_chain.url);
              if (evoRes.ok) {
                const evoData = await evoRes.json();
                evolutionChain = evoData.chain;
              }
            } catch (e) {
              console.error('Failed to fetch evolution chain', e);
            }
          }

          // Fetch details for each variety
          varieties = await Promise.all(nonDefaultVarieties.map(async (v: any) => {
            try {
              const vRes = await fetch(v.pokemon.url);
              const vData = await vRes.json();
              return {
                ...v,
                details: {
                  types: vData.types.map((t: any) => t.type.name),
                  sprite: vData.sprites.other['official-artwork'].front_default || vData.sprites.front_default,
                  stats: vData.stats,
                  abilities: vData.abilities
                }
              };
            } catch (e) {
              return v;
            }
          }));
        }

        // Fetch ability details
        const abilitiesWithDetails: PokemonAbility[] = await Promise.all(
          pData.abilities.map(async (a: any) => {
            try {
              const abilityRes = await fetch(a.ability.url);
              if (abilityRes.ok) {
                const abilityData = await abilityRes.json();
                const englishEntry = abilityData.effect_entries.find((e: any) => e.language.name === 'en');
                return {
                  ...a,
                  details: {
                    effect: englishEntry?.effect || 'No description available.',
                    short_effect: englishEntry?.short_effect || 'No description available.',
                  }
                };
              }
            } catch (e) {
              console.error('Failed to fetch ability details', e);
            }
            return a;
          })
        );

        if (isMounted) {
          setDetails({
            id: pData.id,
            name: pData.name,
            types: pData.types.map((t: any) => t.type.name),
            sprite: pData.sprites.other['official-artwork'].front_default || pData.sprites.front_default,
            spriteShiny: pData.sprites.other['official-artwork'].front_shiny || pData.sprites.front_shiny,
            stats: pData.stats,
            abilities: abilitiesWithDetails,
            height: pData.height,
            weight: pData.weight,
            moves: pData.moves,
            game_indices: pData.game_indices,
            varieties,
            evolution_chain: evolutionChain
          });
          setEncounters(eData);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    }

    fetchDetails();

    return () => { isMounted = false; };
  }, [id]);

  return { details, encounters, loading };
}
