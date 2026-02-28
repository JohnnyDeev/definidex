import fs from 'fs';
import path from 'path';

const MISSING_FILE = 'd:/Evolith Studio/Sites/definidex/scripts/missing_items.json';

function generateRepetitiveTranslations() {
    const missing = JSON.parse(fs.readFileSync(MISSING_FILE, 'utf-8'));

    const repetitive: Record<string, { name: string; description: string }> = {};
    const remaining: string[] = [];

    for (const item of missing) {
        if (item.startsWith('dynamax-crystal-')) {
            const code = item.replace('dynamax-crystal-', '').toUpperCase();
            repetitive[item] = {
                name: `Cristal Dynamax ${code}`,
                description: `Um cristal que emana energia Galar. Permite enfrentar um Pokémon Gigantamax em uma Max Raid Battle.`
            };
        } else if (item.startsWith('data-card-')) {
            const num = item.replace('data-card-', '');
            repetitive[item] = {
                name: `Cartão de Dados ${num}`,
                description: `Um cartão contendo informações digitais sobre o mundo Pokémon.`
            };
        } else if (item.startsWith('tr') && item.length <= 4) {
            // Already handled in batches 68-69
        } else if (item.startsWith('tm') && item.length <= 4) {
            // Already handled in batches 66-67
        } else {
            remaining.push(item);
        }
    }

    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/items_pt_70.json', JSON.stringify(repetitive, null, 2));
    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/remaining_missing.json', JSON.stringify(remaining, null, 2));

    console.log(`Generated ${Object.keys(repetitive).length} repetitive translations in items_pt_70.json`);
    console.log(`Remaining missing items: ${remaining.length}`);
}

generateRepetitiveTranslations();
