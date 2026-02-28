import { useState, useEffect } from 'react';
import { BasicPokemon } from '../types';

export function usePokemonList() {
  const [pokemon, setPokemon] = useState<BasicPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      try {
        setLoading(true);
        // Fetch all 1025 pokemon
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1300`);
        if (!res.ok) throw new Error('Failed to fetch pokemon list');
        const data = await res.json();

        // Fetch types to map them efficiently
        const typesRes = await fetch(`https://pokeapi.co/api/v2/type`);
        const typesData = await typesRes.json();

        const typeMap: Record<string, string[]> = {};

        await Promise.all(typesData.results.map(async (t: any) => {
          const tRes = await fetch(t.url);
          const tData = await tRes.json();
          tData.pokemon.forEach((p: any) => {
            if (!typeMap[p.pokemon.name]) {
              typeMap[p.pokemon.name] = [];
            }
            typeMap[p.pokemon.name].push(tData.name);
          });
        }));

        const basicList: BasicPokemon[] = data.results.map((p: any) => {
          const urlParts = p.url.split('/');
          const id = parseInt(urlParts[urlParts.length - 2], 10);
          return {
            id,
            name: p.name,
            types: typeMap[p.name] || [],
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          };
        });

        if (isMounted) {
          setPokemon(basicList);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  return { pokemon, loading, error };
}
