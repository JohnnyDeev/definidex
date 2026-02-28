import fs from 'fs';
import path from 'path';

const TARGET_FILE = 'd:/Evolith Studio/Sites/definidex/src/itemTranslations.ts';

async function findMissingItems() {
    const response = await fetch('https://pokeapi.co/api/v2/item?limit=2175');
    const data = await response.json();
    const apiItems = data.results.map((i: any) => i.name);

    const currentTranslations = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf-8').replace('export const itemTranslations: Record<string, { name: string; description: string }> = ', '').replace(';', ''));
    const currentKeys = Object.keys(currentTranslations);

    const missing = apiItems.filter((name: string) => !currentKeys.includes(name));

    console.log(`Total API items: ${apiItems.length}`);
    console.log(`Total translated: ${currentKeys.length}`);
    console.log(`Total missing: ${missing.length}`);

    if (missing.length > 0) {
        console.log('\nMissing items (first 50):');
        console.log(missing.slice(0, 50));
        fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/missing_items.json', JSON.stringify(missing, null, 2));
    }
}

findMissingItems();
