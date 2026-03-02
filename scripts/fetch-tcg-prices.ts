import fs from 'fs';
import path from 'path';

/**
 * fetch-tcg-prices.ts — Fetch TCG card market prices using TCGCSV.com
 * 
 * TCGCSV.com provides free, daily-updated TCGPlayer price data.
 * This script maps prices to our card IDs from tcg-cards.json.
 * 
 * Strategy: For each TCGCSV group (set), fetch products + prices,
 * then match products to our cards by name + card number.
 * 
 * Run: npm run update-tcg-prices
 * Scheduled: Every 3 days via GitHub Actions
 */

const OUTPUT_PATH = path.join(process.cwd(), 'public/data/tcg-prices.json');
const CARDS_PATH = path.join(process.cwd(), 'public/data/tcg-cards.json');

const POKEMON_CATEGORY_ID = 3;
const TCGCSV_BASE = 'https://tcgcsv.com/tcgplayer';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TcgCard {
    id: string;
    name: string;
    set: string;
    setName: string;
    number: string;
}

interface TcgCsvGroup {
    groupId: number;
    name: string;
    abbreviation: string;
}

interface TcgCsvPrice {
    productId: number;
    lowPrice: number | null;
    midPrice: number | null;
    highPrice: number | null;
    marketPrice: number | null;
    directLowPrice: number | null;
    subTypeName: string;
}

interface TcgCsvProduct {
    productId: number;
    name: string;
    cleanName: string;
    extendedData?: Array<{ name: string; value: string }>;
}

// Normalize a name for fuzzy matching
function norm(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

// Strip common prefixes from TCGCSV group names
// e.g., "SV01: Scarlet & Violet Base Set" → "scarlet & violet base set"
// e.g., "SWSH12: Silver Tempest" → "silver tempest"
// e.g., "SM - Burning Shadows" → "burning shadows"
// e.g., "ME: Ascended Heroes" → "ascended heroes"
function stripGroupPrefix(name: string): string {
    return name
        .replace(/^[A-Z]{2,}\d*:\s*/i, '')   // "SV01: " / "SWSH12: " / "ME: "
        .replace(/^[A-Z]{2,}\d*\s*-\s*/i, '') // "SM - "
        .trim();
}

async function fetchJson(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                if (i < retries - 1) { await sleep(2000); continue; }
                return null;
            }
            return await res.json();
        } catch (err) {
            if (i < retries - 1) await sleep(2000);
        }
    }
    return null;
}

async function fetchAllPrices() {
    console.log('Starting TCG price fetch using TCGCSV.com...\n');

    // 1. Load our local card database
    if (!fs.existsSync(CARDS_PATH)) {
        console.error(`Card database not found at ${CARDS_PATH}`);
        process.exit(1);
    }

    const allCards: TcgCard[] = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf-8'));
    console.log(`Loaded ${allCards.length} cards from local database.`);

    // 2. Index cards by normalized set name (multiple keys per set for better matching)
    const cardsByNormSet = new Map<string, TcgCard[]>();
    const addToIndex = (key: string, card: TcgCard) => {
        if (!cardsByNormSet.has(key)) cardsByNormSet.set(key, []);
        cardsByNormSet.get(key)!.push(card);
    };

    for (const card of allCards) {
        addToIndex(norm(card.setName), card);
    }

    const uniqueSets = [...new Set(allCards.map(c => c.setName))];
    console.log(`Found ${uniqueSets.length} unique sets in our database.\n`);

    // 3. Fetch all TCGCSV groups
    console.log('Fetching TCGCSV groups...');
    const groupsData = await fetchJson(`${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/groups`);
    if (!groupsData?.results) {
        console.error('Failed to fetch groups from TCGCSV.');
        process.exit(1);
    }

    const tcgcsvGroups: TcgCsvGroup[] = groupsData.results;
    console.log(`TCGCSV has ${tcgcsvGroups.length} groups.\n`);

    // 4. Match TCGCSV groups to our sets using multiple strategies
    const matchedGroups: { group: TcgCsvGroup; ourCards: TcgCard[] }[] = [];
    const matchedSetNames = new Set<string>();

    for (const group of tcgcsvGroups) {
        // Strategy 1: Exact normalized name
        let key = norm(group.name);
        let cards = cardsByNormSet.get(key);

        // Strategy 2: Strip prefix and match
        if (!cards) {
            const stripped = stripGroupPrefix(group.name);
            key = norm(stripped);
            cards = cardsByNormSet.get(key);
        }

        // Strategy 3: Strip prefix + remove "base set" suffix
        if (!cards) {
            const stripped = stripGroupPrefix(group.name).replace(/\s*base\s*set$/i, '');
            key = norm(stripped);
            cards = cardsByNormSet.get(key);
        }

        // Strategy 4: Try matching just the core name
        // e.g., "SV: Scarlet & Violet 151" → match our "151"
        if (!cards) {
            const stripped = stripGroupPrefix(group.name);
            // Check if any of our set names is contained within the group name
            for (const setName of uniqueSets) {
                if (matchedSetNames.has(setName)) continue;
                const normSetName = norm(setName);
                const normGroupName = norm(stripped);
                // Our set name must be contained in the group name (or vice versa)
                if (normSetName.length >= 3 && (normGroupName.includes(normSetName) || normSetName.includes(normGroupName))) {
                    cards = cardsByNormSet.get(norm(setName));
                    if (cards) break;
                }
            }
        }

        if (cards && cards.length > 0) {
            matchedGroups.push({ group, ourCards: cards });
            cards.forEach(c => matchedSetNames.add(c.setName));
        }
    }

    console.log(`Matched ${matchedGroups.length} sets between our data and TCGCSV.`);

    // Show unmatched sets
    const unmatchedSets = uniqueSets.filter(s => !matchedSetNames.has(s));
    if (unmatchedSets.length > 0) {
        console.log(`\nUnmatched sets (${unmatchedSets.length}):`);
        unmatchedSets.forEach(s => console.log(`  ✗ ${s}`));
    }
    console.log('');

    // 5. For each matched group, fetch prices + products, then map
    const priceMap: { [cardId: string]: number } = {};
    let processedGroups = 0;

    for (const { group, ourCards } of matchedGroups) {
        processedGroups++;
        process.stdout.write(`[${processedGroups}/${matchedGroups.length}] ${group.name}... `);

        // Fetch prices
        const pricesData = await fetchJson(
            `${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/${group.groupId}/prices`
        );

        if (!pricesData?.results) {
            console.log('skip (no prices)');
            await sleep(300);
            continue;
        }

        const prices: TcgCsvPrice[] = pricesData.results;

        // Build productId → best market price
        const priceByProduct = new Map<number, number>();
        for (const p of prices) {
            const price = p.marketPrice || p.midPrice || p.lowPrice;
            if (price && price > 0) {
                if (!priceByProduct.has(p.productId)) {
                    priceByProduct.set(p.productId, price);
                }
            }
        }

        // Fetch products to get card names for matching
        const productsData = await fetchJson(
            `${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/${group.groupId}/products`
        );

        if (!productsData?.results) {
            console.log('skip (no products)');
            await sleep(300);
            continue;
        }

        const products: TcgCsvProduct[] = productsData.results;

        // Build multiple indices for matching products
        // Index by: normalized(cleanName)|number
        const productByKey = new Map<string, TcgCsvProduct>();
        const productByName = new Map<string, TcgCsvProduct>();

        for (const prod of products) {
            const cleanName = norm(prod.cleanName || prod.name);
            let cardNumber = '';
            if (prod.extendedData) {
                const numField = prod.extendedData.find((d: any) => d.name === 'Number');
                if (numField) cardNumber = numField.value;
            }
            // Primary key: name + number
            if (cardNumber) {
                productByKey.set(`${cleanName}|${cardNumber}`, prod);
            }
            // Secondary: just name (gets last one, but often good enough)
            if (!productByName.has(cleanName)) {
                productByName.set(cleanName, prod);
            }
        }

        // Match our cards to products
        let groupMatches = 0;
        for (const card of ourCards) {
            const cardNameNorm = norm(card.name);

            // Try name+number
            let product = productByKey.get(`${cardNameNorm}|${card.number}`);

            // Try just name
            if (!product) {
                product = productByName.get(cardNameNorm);
            }

            if (product && priceByProduct.has(product.productId)) {
                priceMap[card.id] = priceByProduct.get(product.productId)!;
                groupMatches++;
            }
        }

        console.log(`${groupMatches}/${ourCards.length} matched`);
        await sleep(400);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total cards with prices: ${Object.keys(priceMap).length}/${allCards.length}`);
    console.log(`Match rate: ${((Object.keys(priceMap).length / allCards.length) * 100).toFixed(1)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Save
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(priceMap));
    console.log(`Prices cached to ${OUTPUT_PATH}`);
    console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} KB`);
}

fetchAllPrices().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
