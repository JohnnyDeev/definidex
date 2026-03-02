import fs from 'fs';
import path from 'path';

// This script will run daily or weekly via GitHub Actions to cache all TCG card prices locally.
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/tcg-prices.json');
const API_KEY = process.env.VITE_POKEMON_TCG_API_KEY || '14f09d18-3a9d-4c31-8975-d143c0817346';

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllPrices() {
    console.log("Starting to fetch all TCG Card Prices...");
    let page = 1;
    let hasMore = true;
    const priceMap: { [id: string]: number } = {};
    const pageSize = 100; // Reduced from 250 to prevent 504 Gateway Timeouts

    while (hasMore) {
        let retries = 3;
        let success = false;

        while (retries > 0 && !success) {
            try {
                console.log(`Fetching page ${page}...`);
                const res = await fetch(`https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`, {
                    headers: { 'X-Api-Key': API_KEY }
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`Page ${page} failed: ${res.status} ${res.statusText}. Response: ${errorText.substring(0, 200)}`);
                    if (res.status === 504 || res.status === 502 || res.status === 429 || res.status === 503) {
                        console.log(`Retrying page ${page} in 10s...`);
                        await sleep(10000);
                        retries--;
                        continue;
                    }
                    hasMore = false; // abort all
                    break;
                }

                const data = await res.json();
                const cards = data.data;

                if (!cards || cards.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const card of cards) {
                    if (card.tcgplayer?.prices) {
                        const priceData = card.tcgplayer.prices.holofoil ||
                            card.tcgplayer.prices.reverseHolofoil ||
                            card.tcgplayer.prices.normal ||
                            card.tcgplayer.prices['1stEditionHolofoil'];

                        if (priceData && priceData.market) {
                            priceMap[card.id] = priceData.market;
                        }
                    }
                }

                success = true;

                // Be polite
                await sleep(500);

                if (page * pageSize >= data.totalCount) {
                    hasMore = false;
                }
            } catch (err) {
                console.error(`Network error on page ${page}:`, err);
                await sleep(5000);
                retries--;
            }
        }

        if (!success) {
            console.error(`Skipping page ${page} after 3 failed attempts.`);
        }

        if (hasMore) {
            page++;
        }
    }

    console.log(`Finished fetching. Total cards with prices: ${Object.keys(priceMap).length}`);

    // Ensure the public/data directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(priceMap));
    console.log(`Prices cached to ${OUTPUT_PATH}`);
}

fetchAllPrices();
