/**
 * tcgApi.ts — Pokémon TCG Data Service (100% STATIC / LOCAL)
 * 
 * ALL data comes from pre-fetched static JSON files:
 * - /data/tcg-sets.json  (171 sets, from GitHub PokemonTCG/pokemon-tcg-data)
 * - /data/tcg-cards.json (20k+ cards, from GitHub PokemonTCG/pokemon-tcg-data)
 * 
 * NO external API calls — instant search, zero latency, no CORS issues.
 */

// ─── Types ───────────────────────────────────────

export interface TcgSet {
    id: string;
    name: string;
    series: string;
    releaseDate: string;
}

/** Slim card shape stored in the static JSON */
export interface TcgCard {
    id: string;
    name: string;
    supertype: string;
    subtypes: string[];
    types: string[];
    hp: string;
    set: string;         // set ID
    setName: string;     // set display name
    series: string;      // series name
    number: string;
    regulationMark: string;
    img: string;         // small thumbnail
    imgLg: string;       // large image
    legalities: {
        standard?: string;
        expanded?: string;
        unlimited?: string;
    };
}

export type TcgFormat = 'standard' | 'expanded';

// ─── Data Loaders (cached in memory) ─────────────

let setsCache: TcgSet[] | null = null;
let cardsCache: TcgCard[] | null = null;
let cardsLoadingPromise: Promise<TcgCard[]> | null = null;

export async function fetchSets(): Promise<TcgSet[]> {
    if (setsCache) return setsCache;
    const res = await fetch('/data/tcg-sets.json');
    if (!res.ok) throw new Error('Failed to load sets');
    setsCache = await res.json();
    return setsCache!;
}

export async function loadAllCards(): Promise<TcgCard[]> {
    if (cardsCache) return cardsCache;
    // Prevent double-loading
    if (cardsLoadingPromise) return cardsLoadingPromise;

    cardsLoadingPromise = (async () => {
        const res = await fetch('/data/tcg-cards.json');
        if (!res.ok) throw new Error('Failed to load cards');
        const data: TcgCard[] = await res.json();
        cardsCache = data;
        return data;
    })();

    return cardsLoadingPromise;
}

// ─── Client-Side Search ──────────────────────────

export interface SearchResult {
    cards: TcgCard[];
    totalCount: number;
}

export async function searchCards(
    name: string,
    setId?: string,
    page: number = 1,
    pageSize: number = 30,
): Promise<SearchResult> {
    const allCards = await loadAllCards();

    let filtered = allCards;

    // Filter by name (case-insensitive)
    if (name.trim()) {
        const q = name.trim().toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
    }

    // Filter by set
    if (setId) {
        filtered = filtered.filter(c => c.set === setId);
    }

    const totalCount = filtered.length;
    const start = (page - 1) * pageSize;
    const cards = filtered.slice(start, start + pageSize);

    return { cards, totalCount };
}

// ─── Format Validation (deck-side only) ──────────

const STANDARD_MARKS = ['F', 'G', 'H', 'I'];

export function isCardValidForFormat(card: TcgCard, format: TcgFormat): boolean {
    if (format === 'standard') {
        if (!card.regulationMark) return false;
        return STANDARD_MARKS.includes(card.regulationMark);
    }
    // Expanded
    if (card.legalities?.expanded === 'Legal') return true;
    if (card.regulationMark) return true;
    return false;
}

// ─── Basic Energy Detection ──────────────────────

const BASIC_ENERGY_NAMES = [
    'grass energy', 'fire energy', 'water energy', 'lightning energy',
    'psychic energy', 'fighting energy', 'darkness energy', 'metal energy',
    'fairy energy',
];

export function isBasicEnergy(card: TcgCard): boolean {
    if (card.supertype !== 'Energy') return false;
    const lower = card.name.toLowerCase();
    return BASIC_ENERGY_NAMES.some(e => lower.includes(e)) ||
        (card.subtypes?.includes('Basic') ?? false);
}
