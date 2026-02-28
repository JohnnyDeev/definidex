/**
 * fetch-cards.mjs — Downloads ALL card data from the official PokemonTCG GitHub repo
 * and builds a consolidated search-friendly JSON file.
 * 
 * Source: https://github.com/PokemonTCG/pokemon-tcg-data
 * This is MUCH more reliable than the pokemontcg.io API (which constantly 504s).
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';

const GITHUB_BASE = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master';

// Load our sets list
const sets = JSON.parse(readFileSync('public/data/tcg-sets.json', 'utf-8'));
console.log(`Found ${sets.length} sets to fetch`);

const allCards = [];
let failed = 0;

for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    const url = `${GITHUB_BASE}/cards/en/${set.id}.json`;

    process.stdout.write(`[${i + 1}/${sets.length}] ${set.name} (${set.id})... `);

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`SKIP (${res.status})`);
            failed++;
            continue;
        }

        const cards = await res.json();

        // Extract only the fields we need to keep file size manageable
        const slim = cards.map(c => ({
            id: c.id,
            name: c.name,
            supertype: c.supertype,
            subtypes: c.subtypes || [],
            types: c.types || [],
            hp: c.hp || '',
            set: set.id,
            setName: set.name,
            series: set.series,
            number: c.number,
            regulationMark: c.regulationMark || '',
            img: c.images?.small || '',
            imgLg: c.images?.large || '',
            legalities: c.legalities || {},
        }));

        allCards.push(...slim);
        console.log(`${slim.length} cards`);
    } catch (err) {
        console.log(`ERROR: ${err.message}`);
        failed++;
    }
}

console.log(`\nTotal: ${allCards.length} cards from ${sets.length - failed} sets (${failed} failed)`);

// Sort by set release date (newest first) — sets are already sorted
// Save consolidated file
const outputDir = 'public/data';
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

writeFileSync(`${outputDir}/tcg-cards.json`, JSON.stringify(allCards));
console.log(`Saved to ${outputDir}/tcg-cards.json (${(JSON.stringify(allCards).length / 1024 / 1024).toFixed(1)}MB)`);
