import fs from 'fs';
import path from 'path';

const ULTRA_REMAINING_FILE = 'd:/Evolith Studio/Sites/definidex/scripts/ultra_final_remaining.json';

function generatePicnicTranslations() {
    const missing = JSON.parse(fs.readFileSync(ULTRA_REMAINING_FILE, 'utf-8'));

    const translations: Record<string, { name: string; description: string }> = {};
    const stillRemaining: string[] = [];

    const picnicTerms: Record<string, string> = {
        'bottle': 'Garrafa',
        'cup': 'Copo',
        'tablecloth': 'Toalha de Mesa',
        'dish': 'Prato',
        'pick': 'Palito'
    };

    for (const item of missing) {
        let matched = false;

        // Picnic Items
        if (item.includes('-bottle') || item.includes('-cup') || item.includes('-tablecloth') || item.includes('-dish') || item.includes('-pick')) {
            const parts = item.split('-');
            const suffix = parts[parts.length - 1];
            const type = picnicTerms[suffix] || suffix;
            const detail = parts.slice(0, -1).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

            translations[item] = {
                name: `${type} ${detail}`,
                description: `Um item décor especial usado para personalizar seus piqueniques Pokémon.`
            };
            matched = true;
        } else if (item.startsWith('roto-')) {
            const effect = item.replace('roto-', '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            translations[item] = {
                name: `Roto-Poder ${effect}`,
                description: `Um poder temporário ativado pelo Rotom que concede bônus especiais.`
            };
            matched = true;
        } else if (item.endsWith('-candy-l')) {
            const pokemon = item.replace('-candy-l', '').charAt(0).toUpperCase() + item.replace('-candy-l', '').slice(1);
            translations[item] = {
                name: `Doce ${pokemon} G`,
                description: `Um doce grande que concede muita experiência ao Pokémon.`
            };
            matched = true;
        } else if (item.endsWith('-candy-xl')) {
            const pokemon = item.replace('-candy-xl', '').charAt(0).toUpperCase() + item.replace('-candy-xl', '').slice(1);
            translations[item] = {
                name: `Doce ${pokemon} XG`,
                description: `Um doce extra grande que concede uma quantidade imensa de experiência ao Pokémon.`
            };
            matched = true;
        }

        if (!matched) {
            stillRemaining.push(item);
        }
    }

    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/items_pt_73.json', JSON.stringify(translations, null, 2));
    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/mega_final_remaining.json', JSON.stringify(stillRemaining, null, 2));

    console.log(`Generated ${Object.keys(translations).length} translations in items_pt_73.json`);
    console.log(`Mega final remaining items: ${stillRemaining.length}`);
}

generatePicnicTranslations();
