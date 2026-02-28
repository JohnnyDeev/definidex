import fs from 'fs';
import path from 'path';

const REMAINING_FILE = 'd:/Evolith Studio/Sites/definidex/scripts/remaining_missing.json';

function generateSmartTranslations() {
    const missing = JSON.parse(fs.readFileSync(REMAINING_FILE, 'utf-8'));

    const translations: Record<string, { name: string; description: string }> = {};
    const stillRemaining: string[] = [];

    for (const item of missing) {
        if (item.endsWith('-candy') && !item.includes('-l') && !item.includes('-xl')) {
            const pokemon = item.replace('-candy', '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            translations[item] = {
                name: `Doce de ${pokemon}`,
                description: `Um doce energético que aumenta os atributos de certos Pokémon.`
            };
        } else if (item.endsWith('-mint')) {
            const personality = item.replace('-mint', '').charAt(0).toUpperCase() + item.replace('-mint', '').slice(1);
            translations[item] = {
                name: `Menta ${personality}`,
                description: `Uma menta que altera o crescimento dos atributos do Pokémon para a natureza ${personality}.`
            };
        } else if (item.endsWith('-mochi')) {
            const type = item.replace('-mochi', '').charAt(0).toUpperCase() + item.replace('-mochi', '').slice(1);
            translations[item] = {
                name: `Mochi de ${type}`,
                description: `Um mochi doce que aumenta os pontos base para o atributo ${type}.`
            };
        } else if (item.endsWith('-wing')) {
            const type = item.replace('-wing', '').charAt(0).toUpperCase() + item.replace('-wing', '').slice(1);
            translations[item] = {
                name: `Pena de ${type}`,
                description: `Uma pena que aumenta levemente os pontos base para o atributo ${type}.`
            };
        } else if (item.startsWith('tm') && !isNaN(parseInt(item.replace('tm', '')))) {
            const num = item.replace('tm', '');
            translations[item] = {
                name: `TM${num}`,
                description: `Máquina Técnica que ensina um golpe específico a um Pokémon compatível.`
            };
        } else if (item.startsWith('la') && item.endsWith('-ball')) {
            // Hisui balls
            const ballType = item.replace('la', '').replace('-ball', '').charAt(0).toUpperCase() + item.replace('la', '').replace('-ball', '').slice(1);
            translations[item] = {
                name: `${ballType} Bola (Hisui)`,
                description: `Uma Poké Bola de estilo antigo feita à mão na região de Hisui.`
            };
        } else {
            stillRemaining.push(item);
        }
    }

    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/items_pt_71.json', JSON.stringify(translations, null, 2));
    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/final_remaining.json', JSON.stringify(stillRemaining, null, 2));

    console.log(`Generated ${Object.keys(translations).length} translations in items_pt_71.json`);
    console.log(`Final remaining items: ${stillRemaining.length}`);
}

generateSmartTranslations();
