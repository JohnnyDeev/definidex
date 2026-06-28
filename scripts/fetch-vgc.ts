import fs from 'fs';
import path from 'path';

// Fetch REAL VGC teams from Smogon usage stats
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/vgc-teams.json');

// Map names to PokeAPI formats
const formMap: { [key: string]: string } = {
    'urshifu': 'urshifu-single-strike',
    'urshifu-*': 'urshifu-rapid-strike',
    'urshifu-rapid-strike': 'urshifu-rapid-strike',
    'urshifu-single-strike': 'urshifu-single-strike',
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
    'basculegion-m': 'basculegion-male',
    'amoongus': 'amoonguss',
    'flutter mane': 'flutter-mane',
    'roaring moon': 'roaring-moon',
    'iron hands': 'iron-hands',
    'iron bundle': 'iron-bundle',
    'iron crown': 'iron-crown',
    'iron boulder': 'iron-boulder',
    'raging bolt': 'raging-bolt',
    'gouging fire': 'gouging-fire',
    'walking wake': 'walking-wake',
    'chien-pao': 'chien-pao',
    'chi-yu': 'chi-yu',
    'ting-lu': 'ting-lu',
    'farigiraf': 'farigiraf',
    'rillaboom': 'rillaboom',
    'incineroar': 'incineroar',
    'landorus-therian': 'landorus-therian',
    'kyogre': 'kyogre',
    'groudon': 'groudon',
    'miraidon': 'miraidon',
    'koraidon': 'koraidon',
    'archaludon': 'archaludon',
    'florges': 'florges'
};

const normalizeItemMoves = (slug: string) => {
    return slug.toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

const getPokemonId = async (name: string): Promise<number> => {
    let searchName = name.toLowerCase().replace(/ /g, '-').replace(/[.-]/g, '-').replace(/-+$/, '');
    if (searchName === 'urshifu-rapid') searchName = 'urshifu-rapid-strike';
    if (formMap[searchName]) searchName = formMap[searchName];

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchName}`);
        if (res.ok) {
            const data = await res.json();
            return data.id;
        }
    } catch (e) {
        console.warn(`Failed to fetch ID for ${name} (${searchName})`);
    }
    return 0;
};

async function fetchTeams() {
    console.log('--- Fetching REAL VGC Meta Teams from Smogon ---');

    const now = new Date();

    // Try multiple months (current and previous 3)
    const months = [];
    for (let i = 0; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Search for latest regulations first
    const formats = [
        { year: '2026', regs: ['regz', 'regy', 'regx', 'regw', 'regv', 'regu', 'regt', 'regs', 'regr', 'regq', 'regp', 'rego', 'regn', 'regm', 'regl', 'regk', 'regj', 'regi', 'regh', 'regg', 'regf', 'rege'] },
        { year: '2025', regs: ['regj', 'regi', 'regh', 'regg'] }
    ];

    let data = null;
    let selectedFormat = '';
    let selectedMonth = '';

    for (const month of months) {
        for (const config of formats) {
            for (const reg of config.regs) {
                const formatName = `gen9vgc${config.year}${reg}`;
                const url = `https://www.smogon.com/stats/${month}/chaos/${formatName}-1760.json`;
                console.log(`Trying: ${url}`);

                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        data = await response.json();
                        selectedFormat = formatName;
                        selectedMonth = month;
                        console.log(`✓ Found data for ${formatName} in ${month}`);
                        break;
                    }
                } catch (e) {
                    console.log(`✗ Failed for ${formatName} in ${month}`);
                }
            }
            if (data) break;
        }
        if (data) break;
    }

    if (!data) {
        console.error('❌ Could not find VGC data from Smogon');
        process.exit(1);
    }

    // Get top 20 Pokemon by usage
    const rawPokemon = Object.entries(data.data)
        .map(([name, stats]: [string, any]) => ({
            name,
            usage: stats['Usage'] || 0,
            rawCount: stats['Raw count'] || 0,
            items: Object.entries(stats.Items || {}).sort((a: any, b: any) => b[1] - a[1]),
            moves: Object.entries(stats.Moves || {}).sort((a: any, b: any) => b[1] - a[1]),
            abilities: Object.entries(stats.Abilities || {}).sort((a: any, b: any) => b[1] - a[1])
        }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 20);

    console.log(`\nTop 20 Pokemon by usage loaded`);

    // Build 3 teams based on highest usage + synergy
    // Team 1: Top 6 most used
    // Team 2: Next 6 most used  
    // Team 3: Best mixed (alternating picks)

    const teams = [];

    // Team 1: Top Usage
    const team1 = [];
    for (let i = 0; i < 6 && i < rawPokemon.length; i++) {
        const p = rawPokemon[i];
        const topItem = p.items.length > 0 && p.items[0][0] !== 'nothing' ? p.items[0][0] : 'leftovers';
        const top4Moves = p.moves.slice(0, 4).map(m => m[0]);
        const pokemonId = await getPokemonId(p.name);

        team1.push({
            pokemonId,
            name: p.name.toLowerCase(),
            types: [],
            item: normalizeItemMoves(topItem),
            moves: top4Moves.map(m => normalizeItemMoves(m))
        });
    }
    teams.push({
        id: `vgc-meta-${selectedFormat}-1`,
        name: `Top Usage Team (${(rawPokemon[0]?.usage * 100).toFixed(1)}% core)`,
        source: `Smogon ${selectedMonth} - ${selectedFormat}`,
        pokemons: team1
    });

    // Team 2: Next 6 (positions 7-12)
    const team2 = [];
    for (let i = 6; i < 12 && i < rawPokemon.length; i++) {
        const p = rawPokemon[i];
        const topItem = p.items.length > 0 && p.items[0][0] !== 'nothing' ? p.items[0][0] : 'leftovers';
        const top4Moves = p.moves.slice(0, 4).map(m => m[0]);
        const pokemonId = await getPokemonId(p.name);

        team2.push({
            pokemonId,
            name: p.name.toLowerCase(),
            types: [],
            item: normalizeItemMoves(topItem),
            moves: top4Moves.map(m => normalizeItemMoves(m))
        });
    }
    teams.push({
        id: `vgc-meta-${selectedFormat}-2`,
        name: `Rising Stars Team`,
        source: `Smogon ${selectedMonth} - ${selectedFormat}`,
        pokemons: team2
    });

    // Team 3: Mixed best (pick every 3rd from top 18)
    const team3 = [];
    for (let i = 0; i < 6; i++) {
        const idx = i * 3;
        if (idx >= rawPokemon.length) break;
        const p = rawPokemon[idx];
        const topItem = p.items.length > 0 && p.items[0][0] !== 'nothing' ? p.items[0][0] : 'leftovers';
        const top4Moves = p.moves.slice(0, 4).map(m => m[0]);
        const pokemonId = await getPokemonId(p.name);

        team3.push({
            pokemonId,
            name: p.name.toLowerCase(),
            types: [],
            item: normalizeItemMoves(topItem),
            moves: top4Moves.map(m => normalizeItemMoves(m))
        });
    }
    teams.push({
        id: `vgc-meta-${selectedFormat}-3`,
        name: `Diversity Pick Team`,
        source: `Smogon ${selectedMonth} - ${selectedFormat}`,
        pokemons: team3
    });

    console.log(`\nGenerated ${teams.length} teams based on real usage stats.`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(teams, null, 2));
    console.log(`Saved to ${OUTPUT_PATH}`);
}

fetchTeams().catch(err => {
    console.error('Error fetching teams:', err);
    process.exit(1);
});
