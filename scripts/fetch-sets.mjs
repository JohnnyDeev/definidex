// Fetch all TCG sets from pokemontcg.io and save as static JSON
const API = 'https://api.pokemontcg.io/v2/sets';
const allSets = [];
let page = 1;

while (true) {
    const url = `${API}?pageSize=100&page=${page}&orderBy=-releaseDate`;
    console.log(`Fetching page ${page}: ${url}`);

    const res = await fetch(url);
    console.log('Status:', res.status);

    if (!res.ok) {
        console.error('HTTP Error', res.status);
        const text = await res.text();
        console.error(text.substring(0, 200));
        break;
    }

    const data = await res.json();
    if (!data.data || data.data.length === 0) break;

    allSets.push(...data.data);
    console.log(`Got ${data.data.length} sets (total: ${allSets.length} of ${data.totalCount})`);

    if (allSets.length >= data.totalCount) break;
    page++;
}

// Slim down to only what we need
const slim = allSets.map(s => ({
    id: s.id,
    name: s.name,
    series: s.series,
    releaseDate: s.releaseDate,
}));

// Sort by release date descending
slim.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

const fs = await import('fs');
fs.writeFileSync('public/data/tcg-sets.json', JSON.stringify(slim, null, 2));
console.log(`Done! Saved ${slim.length} sets to public/data/tcg-sets.json`);
