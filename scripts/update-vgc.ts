import fs from 'fs';
import path from 'path';

// Usage: npx tsx scripts/update-vgc.ts

const OUTPUT_PATH = path.join(process.cwd(), 'src/data/vgc-meta.json');

async function updateVGCData() {
    console.log('--- VGC Meta Update Script (Handle Spaces) ---');

    const now = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    let data: any = null;
    let selectedMonth = '';
    let selectedFormat = '';

    // Search for 2026 formats first, then 2025 as fallback
    const formats = [
        { year: '2026', regs: ['regf', 'rege'] },
        { year: '2025', regs: ['regj', 'regi', 'regh', 'regg'] }
    ];

    for (const month of months) {
        for (const config of formats) {
            for (const reg of config.regs) {
                const formatName = `gen9vgc${config.year}${reg}`;
                const url = `https://www.smogon.com/stats/${month}/chaos/${formatName}-1760.json`;

                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        data = await response.json();
                        selectedMonth = month;
                        selectedFormat = formatName;
                        break;
                    }
                } catch (e) { }
            }
            if (data) break;
        }
        if (data) break;
    }

    if (!data) {
        console.error('Could not find any recent VGC data.');
        process.exit(1);
    }

    // Handle keys with spaces
    const totalBattles = data.info?.['number of battles'] || data.info?.number_of_battles || 1;
    console.log(`Found ${selectedFormat} in ${selectedMonth} with ${totalBattles} battles.`);

    const rawPokemon = Object.entries(data.data)
        .sort((a: any, b: any) => {
            const countA = a[1]['Raw count'] || a[1].RawCount || 0;
            const countB = b[1]['Raw count'] || b[1].RawCount || 0;
            return countB - countA;
        })
        .slice(0, 50);

    const pokemonList = [];

    for (const [name, stats] of rawPokemon as [string, any][]) {
        const count = stats['Raw count'] || stats.RawCount || 0;
        const items = Object.entries(stats.Items || {}).sort((a: any, b: any) => b[1] - a[1]);
        const topItem = items.length > 0 ? items[0][0] : 'none';

        const abilities = Object.entries(stats.Abilities || {}).sort((a: any, b: any) => b[1] - a[1]);
        const topAbility = abilities.length > 0 ? abilities[0][0] : 'none';

        const moves = Object.entries(stats.Moves || {})
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 4)
            .map(m => m[0]);

        let searchName = name.toLowerCase()
            .replace(/ /g, '-')
            .replace(/[.-]/g, '-')
            .replace(/-+$/, '');

        if (searchName.includes('-*')) searchName = searchName.split('-')[0];

        const formMap: { [key: string]: string } = {
            'urshifu-*': 'urshifu-rapid-strike',
            'urshifu': 'urshifu-single-strike',
            'indeedee-f': 'indeedee-female',
            'indeedee-m': 'indeedee-male',
            'tornadus': 'tornadus-incarnate',
            'thundurus': 'thundurus-incarnate',
            'landorus': 'landorus-incarnate',
            'enamorus': 'enamorus-incarnate',
            'ogerpon-wellspring': 'ogerpon-wellspring-mask',
            'ogerpon-hearthflame': 'ogerpon-hearthflame-mask',
            'ogerpon-cornerstone': 'ogerpon-cornerstone-mask',
            'calyrex-ice-rider': 'calyrex-ice',
            'calyrex-shadow-rider': 'calyrex-shadow',
            'basculegion-f': 'basculegion-female',
            'basculegion-m': 'basculegion-male'
        };

        if (formMap[searchName]) searchName = formMap[searchName];

        let id = 0;
        try {
            const pRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchName}`);
            if (pRes.ok) {
                const pData = await pRes.json();
                id = pData.id;
            }
        } catch (e) { }

        // Helper to normalize Smogon names to PokeAPI slugs (adding dashes where needed)
        const normalizeSlug = (slug: string) => {
            const low = slug.toLowerCase().replace(/ /g, '');
            const commonReplacements: { [key: string]: string } = {
                // Items
                'boosterenergy': 'booster-energy',
                'choicespecs': 'choice-specs',
                'choicescarf': 'choice-scarf',
                'choiceband': 'choice-band',
                'focusash': 'focus-sash',
                'focussash': 'focus-sash',
                'lifeorb': 'life-orb',
                'assaultvest': 'assault-vest',
                'sitrusberry': 'sitrus-berry',
                'safetygoggles': 'safety-goggles',
                'mysticwater': 'mystic-water',
                'covertcloak': 'covert-cloak',
                'leftovers': 'leftovers',
                'clearamulet': 'clear-amulet',
                'mirrorsherb': 'mirror-herb',
                'rockyhelmet': 'rocky-helmet',
                'mentalherb': 'mental-herb',
                'whiteherb': 'white-herb',
                'powerherb': 'power-herb',
                'weaknesspolicy': 'weakness-policy',
                'expertbelt': 'expert-belt',
                'muscleband': 'muscle-band',
                'wiseglasses': 'wise-glasses',
                'focusband': 'focus-band',
                'quickclaw': 'quick-claw',
                'ironball': 'iron-ball',
                'stickybarb': 'sticky-barb',
                'blackbelt': 'black-belt',
                'charcoal': 'charcoal',
                'wellspringmask': 'wellspring-mask',
                'hearthflamemask': 'hearthflame-mask',
                'cornerstonemask': 'cornerstone-mask',
                'throatspray': 'throat-spray',
                'loadeddice': 'loaded-dice',
                'amuletcoin': 'amulet-coin',

                // Abilities
                'protosynthesis': 'protosynthesis',
                'intimidate': 'intimidate',
                'unseenfist': 'unseen-fist',
                'prankster': 'prankster',
                'grassysurge': 'grassy-surge',
                'waterabsorb': 'water-absorb',
                'regenerator': 'regenerator',
                'sheerforce': 'sheer-force',
                'armortail': 'armor-tail',
                'swordofruin': 'sword-of-ruin',
                'beadsofruin': 'beads-of-ruin',
                'tabletsofruin': 'tablets-of-ruin',
                'vesselofruin': 'vessel-of-ruin',

                // Moves
                'shadowball': 'shadow-ball',
                'dazzlinggleam': 'dazzling-gleam',
                'icywind': 'icy-wind',
                'fakeout': 'fake-out',
                'flareblitz': 'flare-blitz',
                'knockoff': 'knock-off',
                'partingshot': 'parting-shot',
                'surgingstrikes': 'surging-strikes',
                'closecombat': 'close-combat',
                'aquajet': 'aqua-jet',
                'uturn': 'u-turn',
                'dragonpulse': 'dragon-pulse',
                'bleakwindstorm': 'bleakwind-storm',
                'sandsearstorm': 'sandsear-storm',
                'wildboltstorm': 'wildbolt-storm',
                'raindance': 'rain-dance',
                'grassyglide': 'grassy-glide',
                'highhorsepower': 'high-horsepower',
                'ivycudgel': 'ivy-cudgel',
                'spikyshield': 'spiky-shield',
                'followme': 'follow-me',
                'hornleech': 'horn-leech',
                'swordsdance': 'swords-dance',
                'extremespeed': 'extreme-speed',
                'helpinghand': 'helping-hand',
                'trickroom': 'trick-room',
                'tailwind': 'tailwind',
                'protect': 'protect',
                'voltswitch': 'volt-switch',
                'electroweb': 'electroweb',
                'wildcharge': 'wild-charge',
                'willowisp': 'will-o-wisp',
                'sunnyday': 'sunny-day',
                'nastyplot': 'nasty-plot',
                'calmmind': 'calm-mind',
                'acidspray': 'acid-spray',
                'flowertrick': 'flower-trick',
                'gigadrain': 'giga-drain',
                'pollenpuff': 'pollen-puff',
                'ragepowder': 'rage-powder',
                'spore': 'spore',
                'burningjealousy': 'burning-jealousy',
                'earthpower': 'earth-power',
                'scald': 'scald',
                'hydropump': 'hydro-pump',
                'bloodmoon': 'blood-moon',
                'hypervoice': 'hyper-voice',
                'moonblast': 'moonblast',
                'psychicnoise': 'psychic-noise',
                'expandingforce': 'expanding-force',
                'sludgebomb': 'sludge-bomb',
                'suckerpunch': 'sucker-punch',
                'sacredsword': 'sacred-sword',
                'icespinner': 'ice-spinner',
                'woodhammer': 'wood-hammer',
                'makeitrain': 'make-it-rain',
                'goldrush': 'make-it-rain'
            };

            if (commonReplacements[low]) return commonReplacements[low];
            return low;
        };

        pokemonList.push({
            id,
            name,
            usage: ((count / totalBattles) * 100).toFixed(1) + '%',
            item: normalizeSlug(topItem),
            ability: normalizeSlug(topAbility),
            moves: moves.map(m => normalizeSlug(m))
        });
    }

    const finalOutput = {
        lastUpdated: new Date().toISOString().split('T')[0],
        month: selectedMonth,
        format: selectedFormat,
        pokemon: pokemonList
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalOutput, null, 2));
    console.log(`Successfully updated ${OUTPUT_PATH}.`);
}

updateVGCData().catch(console.error);
