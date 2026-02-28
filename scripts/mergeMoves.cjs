/**
 * Merge all PT-BR move translation JSON batches into moveTranslations.ts
 * AND regenerate the file from API data with Portuguese descriptions.
 */
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://pokeapi.co/api/v2';

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}: ${res.status}`);
    return res.json();
}

function esc(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

async function main() {
    // 1. Load all PT-BR JSON batches
    console.log('📂 Carregando traduções PT-BR...');
    const ptMoves = {};
    for (let i = 1; i <= 5; i++) {
        const file = path.join(__dirname, `moves_pt_${i}.json`);
        if (fs.existsSync(file)) {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            Object.assign(ptMoves, data);
            console.log(`  Lote ${i}: ${Object.keys(data).length} golpes`);
        }
    }
    console.log(`  Total PT-BR: ${Object.keys(ptMoves).length} golpes`);

    // 2. Fetch all moves from API
    console.log('\n🌐 Buscando golpes da API...');
    const first = await fetchJSON(`${API_BASE}/move?limit=1`);
    const all = await fetchJSON(`${API_BASE}/move?limit=${first.count}`);
    console.log(`  Total na API: ${all.results.length}`);

    // 3. Fetch details in batches
    const moves = [];
    const BATCH = 100;
    for (let i = 0; i < all.results.length; i += BATCH) {
        const batch = all.results.slice(i, i + BATCH);
        process.stdout.write(`\r  Buscando detalhes... ${Math.min(i + BATCH, all.results.length)}/${all.results.length}`);
        const results = await Promise.allSettled(batch.map(m => fetchJSON(m.url)));
        for (const r of results) {
            if (r.status === 'fulfilled') moves.push(r.value);
        }
        if (i + BATCH < all.results.length) await new Promise(r => setTimeout(r, 200));
    }
    console.log('');

    // 4. Generate output
    let ptCount = 0;
    let enCount = 0;
    let output = `export const ptBRMoveTranslations: Record<string, { description: string }> = {\n`;

    for (const move of moves.sort((a, b) => a.name.localeCompare(b.name))) {
        const slug = move.name;
        let desc;

        if (ptMoves[slug]) {
            desc = ptMoves[slug];
            ptCount++;
        } else {
            // Fallback to English from API
            const entries = move.flavor_text_entries || [];
            const en = entries.find(e => e.language?.name === 'en');
            desc = en ? en.flavor_text.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim() : `Golpe Pokémon: ${slug}.`;
            enCount++;
        }

        output += `  '${slug}': { description: '${esc(desc)}' },\n`;
    }
    output += `};\n`;

    const outPath = path.join(__dirname, '..', 'src', 'moveTranslations.ts');
    fs.writeFileSync(outPath, output, 'utf8');

    console.log(`\n✅ moveTranslations.ts gerado!`);
    console.log(`   Total: ${moves.length} golpes`);
    console.log(`   Em PT-BR: ${ptCount}`);
    console.log(`   Restantes em EN: ${enCount}`);
}

main().catch(err => { console.error('❌ Erro:', err); process.exit(1); });
