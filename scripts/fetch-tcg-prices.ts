import fs from 'fs';
import path from 'path';

/**
 * fetch-tcg-prices.ts — Fetch TCG card market prices from TCGCSV.com
 * 
 * This is the definitive version. Strategy:
 * 1. Process ALL TCGCSV groups
 * 2. For each group, try to match it to one of our sets using multiple strategies
 * 3. Within matched sets, match by CARD NUMBER first, then by name
 * 4. Includes hardcoded mappings for sets with naming differences
 * 
 * Run: npm run update-tcg-prices
 */

const OUTPUT_PATH = path.join(process.cwd(), 'public/data/tcg-prices.json');
const CARDS_PATH = path.join(process.cwd(), 'public/data/tcg-cards.json');
const POKEMON_CATEGORY_ID = 3;
const TCGCSV_BASE = 'https://tcgcsv.com/tcgplayer';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TcgCard { id: string; name: string; set: string; setName: string; number: string; }
interface TcgCsvGroup { groupId: number; name: string; abbreviation: string; }
interface TcgCsvPrice { productId: number; lowPrice: number | null; midPrice: number | null; highPrice: number | null; marketPrice: number | null; directLowPrice: number | null; subTypeName: string; }
interface TcgCsvProduct { productId: number; name: string; cleanName: string; extendedData?: Array<{ name: string; value: string }>; }

function norm(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }
function normNum(n: string): string { return n.toLowerCase().replace(/^0+/, '') || '0'; }

function stripPrefix(name: string): string {
    return name
        .replace(/^[A-Z]{2,}\d*:\s*/i, '')
        .replace(/^[A-Z]{2,}\d*\s*-\s*/i, '')
        .trim();
}

// Hardcoded TCGCSV group name → our set name for difficult matches
const MANUAL_MAP: Record<string, string> = {
    'SV: Scarlet & Violet 151': '151',
    'SV01: Scarlet & Violet Base Set': 'Scarlet & Violet',
    'SV: Scarlet & Violet Promo Cards': 'Scarlet & Violet Black Star Promos',
    'SVE: Scarlet & Violet Energies': 'Scarlet & Violet Energies',
    'SM Base Set': 'Sun & Moon',
    'SM Promos': 'SM Black Star Promos',
    'Diamond and Pearl': 'Diamond & Pearl',
    'Diamond and Pearl Promos': 'DP Black Star Promos',
    'Ruby and Sapphire': 'Ruby & Sapphire',
    'Expedition': 'Expedition Base Set',
    'Black and White Promos': 'BW Black Star Promos',
    'XY Promos': 'XY Black Star Promos',
    'HGSS Promos': 'HGSS Black Star Promos',
    'WoTC Promo': 'Wizards Black Star Promos',
    'Nintendo Promos': 'Nintendo Black Star Promos',
    'SWSH: Sword & Shield Promo Cards': 'SWSH Black Star Promos',
    'Best of Promos': 'Best of Game',
    'ME01: Mega Evolution': 'Mega Evolution',
    'ME: Mega Evolution Promo': 'Mega Evolution',
    'ME: Ascended Heroes': 'Ascended Heroes',
    'ME02: Phantasmal Flames': 'Phantasmal Flames',
    'MEE: Mega Evolution Energies': 'Mega Evolution',
    'SV10: Destined Rivals': 'Destined Rivals',
    'SV09: Journey Together': 'Journey Together',
    'SV: Prismatic Evolutions': 'Prismatic Evolutions',
    'SV08: Surging Sparks': 'Surging Sparks',
    'SV07: Stellar Crown': 'Stellar Crown',
    'SV: Shrouded Fable': 'Shrouded Fable',
    'SV06: Twilight Masquerade': 'Twilight Masquerade',
    'SV05: Temporal Forces': 'Temporal Forces',
    'SV: Paldean Fates': 'Paldean Fates',
    'SV04: Paradox Rift': 'Paradox Rift',
    'SV03: Obsidian Flames': 'Obsidian Flames',
    'SV02: Paldea Evolved': 'Paldea Evolved',
    'SV: Black Bolt': 'Black Bolt',
    'SV: White Flare': 'White Flare',
    'McDonald\'s Promos 2022': 'McDonald\'s Collection 2022',
    'McDonald\'s 25th Anniversary Promos': 'McDonald\'s Collection 2021',
    'Pokemon GO': 'Pokémon GO',
    'McDonald\'s Promos 2019': 'McDonald\'s Collection 2019',
    'McDonald\'s Promos 2018': 'McDonald\'s Collection 2018',
    'McDonald\'s Promos 2017': 'McDonald\'s Collection 2017',
    'McDonald\'s Promos 2016': 'McDonald\'s Collection 2016',
    'McDonald\'s Promos 2015': 'McDonald\'s Collection 2015',
    'McDonald\'s Promos 2014': 'McDonald\'s Collection 2014',
    'McDonald\'s Promos 2012': 'McDonald\'s Collection 2012',
    'McDonald\'s Promos 2011': 'McDonald\'s Collection 2011',
    'Team Magma vs Team Aqua': 'EX Team Magma vs Team Aqua',
    'Rumble': 'Pokémon Rumble',
};

async function fetchJson(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) { if (i < retries - 1) { await sleep(2000); continue; } return null; }
            return await res.json();
        } catch { if (i < retries - 1) await sleep(2000); }
    }
    return null;
}

async function fetchAllPrices() {
    console.log('Starting TCG price fetch using TCGCSV.com...\n');

    if (!fs.existsSync(CARDS_PATH)) { console.error('Card database not found.'); process.exit(1); }

    const allCards: TcgCard[] = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf-8'));
    console.log(`Loaded ${allCards.length} cards.`);

    // Index cards by set → number → cards[]
    const cardsBySetNum = new Map<string, Map<string, TcgCard[]>>();
    // Also index by set → name → cards[]
    const cardsBySetName = new Map<string, Map<string, TcgCard[]>>();

    for (const card of allCards) {
        // By set+number
        if (!cardsBySetNum.has(card.setName)) cardsBySetNum.set(card.setName, new Map());
        const numMap = cardsBySetNum.get(card.setName)!;
        const nn = normNum(card.number);
        if (!numMap.has(nn)) numMap.set(nn, []);
        numMap.get(nn)!.push(card);

        // By set+name
        if (!cardsBySetName.has(card.setName)) cardsBySetName.set(card.setName, new Map());
        const nameMap = cardsBySetName.get(card.setName)!;
        const nname = norm(card.name);
        if (!nameMap.has(nname)) nameMap.set(nname, []);
        nameMap.get(nname)!.push(card);
    }

    const uniqueSets = [...new Set(allCards.map(c => c.setName))];
    console.log(`Found ${uniqueSets.length} unique sets.\n`);

    // Norm → original set name lookup
    const setNormLookup = new Map<string, string>();
    for (const s of uniqueSets) setNormLookup.set(norm(s), s);

    // Fetch groups
    console.log('Fetching TCGCSV groups...');
    const groupsData = await fetchJson(`${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/groups`);
    if (!groupsData?.results) { console.error('Failed to fetch groups.'); process.exit(1); }
    const groups: TcgCsvGroup[] = groupsData.results;
    console.log(`${groups.length} groups available.\n`);

    // Match each TCGCSV group to our set(s)
    function resolveSet(groupName: string): string | null {
        // 1. Manual mapping
        if (MANUAL_MAP[groupName]) {
            const target = MANUAL_MAP[groupName];
            if (cardsBySetNum.has(target)) return target;
        }

        // 2. Exact normalized match
        let k = norm(groupName);
        if (setNormLookup.has(k)) return setNormLookup.get(k)!;

        // 3. Strip prefix
        const stripped = stripPrefix(groupName);
        k = norm(stripped);
        if (setNormLookup.has(k)) return setNormLookup.get(k)!;

        // 4. Strip "Base Set" suffix
        k = norm(stripped.replace(/\s*base\s*set$/i, ''));
        if (setNormLookup.has(k)) return setNormLookup.get(k)!;

        // 5. Substring containment (min 5 chars to avoid false matches)
        const normStripped = norm(stripped);
        for (const [normSet, original] of setNormLookup) {
            if (normSet.length >= 5 && normStripped.length >= 5) {
                if (normStripped.includes(normSet) || normSet.includes(normStripped)) {
                    return original;
                }
            }
        }

        return null;
    }

    // Process all groups
    const priceMap: { [cardId: string]: number } = {};
    let processed = 0;
    let groupsMatched = 0;

    for (const group of groups) {
        processed++;
        const ourSet = resolveSet(group.name);

        process.stdout.write(`[${processed}/${groups.length}] ${group.name}`);
        if (ourSet) process.stdout.write(` → "${ourSet}"`);
        process.stdout.write('... ');

        if (!ourSet) {
            console.log('skip (no set match)');
            await sleep(200);
            continue;
        }

        // Fetch prices
        const pricesData = await fetchJson(`${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/${group.groupId}/prices`);
        if (!pricesData?.results) { console.log('skip (no prices)'); await sleep(200); continue; }

        const priceByProduct = new Map<number, number>();
        for (const p of pricesData.results as TcgCsvPrice[]) {
            const price = p.marketPrice || p.midPrice || p.lowPrice;
            if (price && price > 0 && !priceByProduct.has(p.productId)) {
                priceByProduct.set(p.productId, price);
            }
        }

        // Fetch products
        const productsData = await fetchJson(`${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/${group.groupId}/products`);
        if (!productsData?.results) { console.log('skip (no products)'); await sleep(200); continue; }

        const products: TcgCsvProduct[] = productsData.results;
        const numMap = cardsBySetNum.get(ourSet);
        const nameMap = cardsBySetName.get(ourSet);
        if (!numMap) { console.log('skip'); continue; }

        let matched = 0;

        for (const prod of products) {
            const price = priceByProduct.get(prod.productId);
            if (!price) continue;

            // Get card number from extended data
            let prodNum = '';
            if (prod.extendedData) {
                const nf = prod.extendedData.find(d => d.name === 'Number');
                if (nf) prodNum = nf.value;
            }

            let didMatch = false;

            // Strategy 1: Match by number (most reliable)
            if (prodNum) {
                const cards = numMap.get(normNum(prodNum));
                if (cards) {
                    for (const card of cards) {
                        if (!priceMap[card.id]) { priceMap[card.id] = price; matched++; didMatch = true; }
                    }
                }
            }

            // Strategy 2: Match by name within set
            if (!didMatch && nameMap) {
                const prodName = norm(prod.cleanName || prod.name);
                const cards = nameMap.get(prodName);
                if (cards) {
                    for (const card of cards) {
                        if (!priceMap[card.id]) { priceMap[card.id] = price; matched++; didMatch = true; }
                    }
                }
            }
        }

        if (matched > 0) {
            groupsMatched++;
            const total = [...numMap.values()].reduce((s, a) => s + a.length, 0);
            console.log(`${matched}/${total}`);
        } else {
            console.log('0');
        }

        await sleep(300);
    }

    // Summary
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Groups matched: ${groupsMatched} / ${groups.length}`);
    console.log(`Cards with prices: ${Object.keys(priceMap).length} / ${allCards.length}`);
    console.log(`Match rate: ${((Object.keys(priceMap).length / allCards.length) * 100).toFixed(1)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const missing = allCards.filter(c => !priceMap[c.id]);
    const bySet: Record<string, number> = {};
    missing.forEach(c => { bySet[c.setName] = (bySet[c.setName] || 0) + 1; });
    const gaps = Object.entries(bySet).sort((a, b) => b[1] - a[1]);
    if (gaps.length > 0) {
        console.log('Remaining gaps (top 15):');
        gaps.slice(0, 15).forEach(([s, n]) => console.log(`  ${n} - ${s}`));
    }

    // Save
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(priceMap));
    console.log(`\nSaved to ${OUTPUT_PATH} (${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} KB)`);
}

fetchAllPrices().catch(err => { console.error('Fatal:', err); process.exit(1); });
