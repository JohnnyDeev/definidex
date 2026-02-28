const https = require('https');

https.get('https://pokeapi.co/api/v2/item/1/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const item = JSON.parse(data);
    console.log(JSON.stringify(item.flavor_text_entries[0]));
    console.log(JSON.stringify(item.effect_entries[0]));
    console.log(JSON.stringify(item.names[0]));
  });
});
