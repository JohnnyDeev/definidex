const https = require('https');

https.get('https://pokeapi.co/api/v2/item/1/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const item = JSON.parse(data);
    console.log("FLAVOR:", JSON.stringify(item.flavor_text_entries[0]));
    console.log("EFFECT:", JSON.stringify(item.effect_entries[0]));
    console.log("NAME:", JSON.stringify(item.names[0]));
  });
});
