import fs from 'fs';
import path from 'path';

const FINAL_REMAINING_FILE = 'd:/Evolith Studio/Sites/definidex/scripts/final_remaining.json';

function generateMaterialTranslations() {
    const missing = JSON.parse(fs.readFileSync(FINAL_REMAINING_FILE, 'utf-8'));

    const translations: Record<string, { name: string; description: string }> = {};
    const stillRemaining: string[] = [];

    const materialSuffixes: Record<string, string> = {
        'fang': 'Presa',
        'fur': 'Pelo',
        'down': 'Plumagem',
        'toxin': 'Toxina',
        'sparks': 'Faíscas',
        'claw': 'Garra',
        'goo': 'Gosma',
        'fluff': 'Penugem',
        'wool': 'Lã',
        'leaf': 'Folha',
        'tears': 'Lágrimas',
        'husk': 'Casca',
        'spines': 'Espinhos',
        'parcel': 'Pacote',
        'nail': 'Unha',
        'hair': 'Cabelo',
        'syrup': 'Xarope',
        'sweat': 'Suor',
        'gem': 'Gema',
        'mucus': 'Muco',
        'lava': 'Lava',
        'pearl': 'Pérola',
        'scrap': 'Retalho',
        'scales': 'Escamas',
        'feather': 'Pena',
        'dust': 'Poeira',
        'poison': 'Veneno',
        'berries': 'Frutas',
        'spores': 'Esporos',
        'slime': 'Gosma',
        'blade': 'Lâmina',
        'fuzz': 'Felpa',
        'powder': 'Pó',
        'tuft': 'Tufos',
        'pollen': 'Polén',
        'kelp': 'Alga',
        'key': 'Chave',
        'rock': 'Pedra',
        'tooth': 'Dente',
        'tarnish': 'Mancha',
        'coal': 'Carvão',
        'stone': 'Pedra',
        'thread': 'Fio',
        'mud': 'Lama',
        'seed': 'Semente',
        'fume': 'Fumaça',
        'grease': 'Gordura',
        'crystal': 'Cristal',
        'ink': 'Tinta',
        'twig': 'Graveto',
        'soot': 'Fuligem',
        'flaps': 'Abas',
        'fragment': 'Fragmento',
        'stem': 'Caule',
        'fluid': 'Fluido',
        'shell': 'Concha',
        'spike': 'Espinho',
        'snack': 'Lanche',
        'cluster': 'Aglomerado'
    };

    for (const item of missing) {
        let matched = false;

        // Match Materials
        for (const [suffix, ptName] of Object.entries(materialSuffixes)) {
            if (item.endsWith(`-${suffix}`)) {
                const pokemon = item.replace(`-${suffix}`, '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                translations[item] = {
                    name: `${ptName} de ${pokemon}`,
                    description: `Um material coletado de um ${pokemon} selvagem. Pode ser usado para criar TMs.`
                };
                matched = true;
                break;
            }
        }

        if (matched) continue;

        // Match TMs
        if (item.startsWith('tm') && !isNaN(parseInt(item.replace('tm', '')))) {
            const num = item.replace('tm', '');
            translations[item] = {
                name: `TM${num}`,
                description: `Máquina Técnica que ensina um golpe específico a um Pokémon compatível.`
            };
            matched = true;
        }

        if (!matched) {
            stillRemaining.push(item);
        }
    }

    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/items_pt_72.json', JSON.stringify(translations, null, 2));
    fs.writeFileSync('d:/Evolith Studio/Sites/definidex/scripts/ultra_final_remaining.json', JSON.stringify(stillRemaining, null, 2));

    console.log(`Generated ${Object.keys(translations).length} translations in items_pt_72.json`);
    console.log(`Ultra final remaining items: ${stillRemaining.length}`);
}

generateMaterialTranslations();
