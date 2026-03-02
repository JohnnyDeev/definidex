import fs from 'fs';
import path from 'path';

/**
 * fetch-tcg-prices.ts — Fetch TCG card market prices using TCGCSV.com
 * 
 * TCGCSV.com provides free, daily-updated TCGPlayer price data.
 * This script maps prices to our card IDs from tcg-cards.json.
 * 
 * Run: npm run update-tcg-prices
 * Scheduled: Every 3 days via GitHub Actions
 */

const OUTPUT_PATH = path.join(process.cwd(), 'public/data/tcg-prices.json');
const CARDS_PATH = path.join(process.cwd(), 'public/data/tcg-cards.json');

// TCGCSV Category ID for Pokémon
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
    number?: string;
    extendedData?: Array<{ name: string; value: string }>;
}

// ─── Set name mapping: our set names → TCGCSV group names ───
// This maps our static card data set names to TCGCSV group names
// Only needed when names differ significantly
function normalizeSetName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

async function fetchJson(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`  HTTP ${res.status} for ${url}`);
                if (i < retries - 1) {
                    await sleep(2000);
                    continue;
                }
                return null;
            }
            return await res.json();
        } catch (err) {
            console.error(`  Network error for ${url}:`, err);
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

    // 2. Build a lookup: setName → cards in that set
    const cardsBySet = new Map<string, TcgCard[]>();
    for (const card of allCards) {
        const key = normalizeSetName(card.setName);
        if (!cardsBySet.has(key)) cardsBySet.set(key, []);
        cardsBySet.get(key)!.push(card);
    }

    // Also index by name+number for cross-matching
    const cardByNameNumber = new Map<string, TcgCard>();
    for (const card of allCards) {
        const key = `${card.name.toLowerCase()}|${card.number}`;
        cardByNameNumber.set(key, card);
    }

    console.log(`Found ${cardsBySet.size} unique sets in our database.\n`);

    // 3. Fetch all TCGCSV groups (sets) for Pokémon
    console.log('Fetching TCGCSV groups...');
    const groupsData = await fetchJson(`${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/groups`);
    if (!groupsData?.results) {
        console.error('Failed to fetch groups from TCGCSV.');
        process.exit(1);
    }

    const tcgcsvGroups: TcgCsvGroup[] = groupsData.results;
    console.log(`TCGCSV has ${tcgcsvGroups.length} groups.\n`);

    // 4. Match our sets to TCGCSV groups
    const matchedGroups: { group: TcgCsvGroup; ourCards: TcgCard[] }[] = [];

    for (const group of tcgcsvGroups) {
        const normalizedName = normalizeSetName(group.name);
        if (cardsBySet.has(normalizedName)) {
            matchedGroups.push({ group, ourCards: cardsBySet.get(normalizedName)! });
        }
    }

    console.log(`Matched ${matchedGroups.length} sets between our data and TCGCSV.\n`);

    // 5. For each matched group, fetch prices and products, then map
    const priceMap: { [cardId: string]: number } = {};
    let processedGroups = 0;
    let totalMatches = 0;

    for (const { group, ourCards } of matchedGroups) {
        processedGroups++;
        process.stdout.write(`[${processedGroups}/${matchedGroups.length}] ${group.name}... `);

        // Fetch prices for this group
        const pricesData = await fetchJson(
            `${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/${group.groupId}/prices`
        );

        if (!pricesData?.results) {
            console.log('skip (no prices)');
            await sleep(300);
            continue;
        }

        const prices: TcgCsvPrice[] = pricesData.results;

        // Build productId → best market price (prefer Normal, then Holofoil, etc.)
        const priceByProduct = new Map<number, number>();
        for (const p of prices) {
            const price = p.marketPrice || p.midPrice || p.lowPrice;
            if (price && price > 0) {
                // Keep the first valid price we find per product (Normal is usually first)
                if (!priceByProduct.has(p.productId)) {
                    priceByProduct.set(p.productId, price);
                }
            }
        }

        // Try matching our cards by name  
        // For this, we need to fetch the products to get names
        const productsData = await fetchJson(
            `${TCGCSV_BASE}/${POKEMON_CATEGORY_ID}/${group.groupId}/products`
        );

        if (productsData?.results) {
            const products: TcgCsvProduct[] = productsData.results;

            // Build name lookup from products
            const productByName = new Map<string, TcgCsvProduct>();
            for (const prod of products) {
                const cleanName = (prod.cleanName || prod.name).toLowerCase();
                // Get the card number from extended data
                let cardNumber = '';
                if (prod.extendedData) {
                    const numField = prod.extendedData.find((d: any) => d.name === 'Number');
                    if (numField) cardNumber = numField.value;
                }
                const key = `${cleanName}|${cardNumber}`;
                productByName.set(key, prod);

                // Also try just by name (less precise but catches more)
                if (!productByName.has(cleanName)) {
                    productByName.set(cleanName, prod);
                }
            }

            // Match our cards to products
            let groupMatches = 0;
            for (const card of ourCards) {
                const cardNameLower = card.name.toLowerCase();
                const nameNumKey = `${cardNameLower}|${card.number}`;

                // Try name+number first (most precise)
                let product = productByName.get(nameNumKey);

                // Fallback to just name
                if (!product) {
                    product = productByName.get(cardNameLower);
                }

                if (product && priceByProduct.has(product.productId)) {
                    priceMap[card.id] = priceByProduct.get(product.productId)!;
                    groupMatches++;
                }
            }

            totalMatches += groupMatches;
            console.log(`${groupMatches}/${ourCards.length} matched`);
        } else {
            console.log('skip (no products)');
        }

        // Be polite — rate limit
        await sleep(400);
    }

    // 6. For unmatched sets, try direct name matching across all cards
    console.log('\nAttempting direct name matching for remaining cards...');
    let directMatches = 0;

    // Now handle unmatched groups — match by looking at ALL products across ALL groups
    // This is done by checking if any card without a price can be matched
    const unmatchedCards = allCards.filter(c => !priceMap[c.id]);
    console.log(`${unmatchedCards.length} cards still without prices.`);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total cards with prices: ${Object.keys(priceMap).length}/${allCards.length}`);
    console.log(`Match rate: ${((Object.keys(priceMap).length / allCards.length) * 100).toFixed(1)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // 7. Save to file
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(priceMap));
    console.log(`Prices cached to ${OUTPUT_PATH}`);
    console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} KB`);
}

fetchAllPrices().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
