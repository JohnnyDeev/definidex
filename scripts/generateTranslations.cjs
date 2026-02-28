/**
 * FINAL unified script: fetch ALL items/moves from PokeAPI 
 * and generate complete PT-BR translation files.
 * 
 * Approach: fetch each item/move, get its English description from the API,
 * and KEEP it as PT-BR description. We CANNOT programmatically translate 
 * 3000+ unique descriptions - so we use the English API descriptions as-is
 * (they are still better than nothing) BUT we keep ALL our manually-written 
 * PT-BR translations (the original 192 items + 116 moves).
 * 
 * The key fix: ONLY use the original manual translations, NOT any 
 * corrupted ones from previous bad runs.
 */

const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 100;
const API_BASE = 'https://pokeapi.co/api/v2';

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}: ${res.status}`);
    return res.json();
}

async function fetchAllPaginated(endpoint) {
    const first = await fetchJSON(`${API_BASE}/${endpoint}?limit=1`);
    const all = await fetchJSON(`${API_BASE}/${endpoint}?limit=${first.count}`);
    console.log(`  Total ${endpoint}: ${all.results.length}`);
    return all.results;
}

async function fetchInBatches(urls, batchSize) {
    const results = [];
    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const pct = Math.round(((i + batch.length) / urls.length) * 100);
        process.stdout.write(`\r  Buscando... ${i + batch.length}/${urls.length} (${pct}%)`);
        const batchResults = await Promise.allSettled(batch.map(u => fetchJSON(u)));
        for (const r of batchResults) {
            if (r.status === 'fulfilled') results.push(r.value);
        }
        if (i + batchSize < urls.length) await new Promise(r => setTimeout(r, 200));
    }
    console.log('');
    return results;
}

function getEnDesc(entries, type = 'flavor') {
    if (!entries?.length) return '';
    const en = entries.find(e => e.language?.name === 'en');
    if (!en) return '';
    const text = type === 'flavor' ? (en.flavor_text || en.text || '') : (en.short_effect || en.effect || '');
    return text.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim();
}

function esc(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

// =====================================================================
// ORIGINAL MANUAL PT-BR TRANSLATIONS (the 192 items that were correct)
// These are the ONLY ones we trust - everything else gets English desc
// =====================================================================

const MANUAL_ITEMS = {
    'ability-shield': 'Impede que sua habilidade seja alterada.',
    'absorb-bulb': 'Um bulbo consumível. Se o portador for atingido por um golpe do tipo Água, seu Atq. Esp. sobe.',
    'aguav-berry': 'Restaura HP; pode confundir.',
    'air-balloon': 'Dá imunidade ao tipo Terrestre até estourar.',
    'antidote': 'Cura o envenenamento de um Pokémon.',
    'assault-vest': 'Aumenta a Def. Esp. em 50%, mas impede o uso de golpes de status.',
    'awakening': 'Acorda um Pokémon adormecido.',
    'berry-juice': 'Suco de Berry que restaura 20 HP.',
    'big-root': 'Aumenta o HP absorvido por golpes que drenam vida.',
    'binding-band': 'Aumenta o dano de golpes que prendem o oponente.',
    'black-belt': 'Aumenta o poder de golpes do tipo Lutador.',
    'black-glasses': 'Aumenta o poder de golpes do tipo Sombrio.',
    'black-sludge': 'Restaura HP de Pokémon do tipo Veneno; causa dano em outros tipos.',
    'bright-powder': 'Reduz a precisão dos golpes do oponente.',
    'burn-heal': 'Cura a queimadura de um Pokémon.',
    'calcium': 'Aumenta os pontos base de Atq. Esp. de um Pokémon.',
    'carbos': 'Aumenta os pontos base de Velocidade de um Pokémon.',
    'charcoal': 'Aumenta o poder de golpes do tipo Fogo.',
    'cheri-berry': 'Cura paralisia quando segurada.',
    'chesto-berry': 'Cura sono quando segurada.',
    'choice-band': 'Aumenta o Ataque em 50%, mas prende a um golpe só.',
    'choice-scarf': 'Aumenta a Velocidade em 50%, mas prende a um golpe só.',
    'choice-specs': 'Aumenta o Atq. Esp. em 50%, mas prende a um golpe só.',
    'cleanse-tag': 'Ajuda a repelir Pokémon selvagens fracos.',
    'custap-berry': 'Dá prioridade ao próximo golpe quando o HP está baixo.',
    'damp-rock': 'Prolonga a duração da chuva quando segurado.',
    'deep-sea-scale': 'Dobra a Def. Esp. de Clamperl quando segurado.',
    'deep-sea-tooth': 'Dobra o Atq. Esp. de Clamperl quando segurado.',
    'destiny-knot': 'Se ficar apaixonado, o oponente também fica.',
    'dire-hit': 'Aumenta a chance de acerto crítico em batalha.',
    'dna-splicers': 'Item que permite fundir/separar Kyurem com Reshiram ou Zekrom.',
    'dragon-fang': 'Aumenta o poder de golpes do tipo Dragão.',
    'dragon-scale': 'Item de evolução. Faz Seadra evoluir para Kingdra ao trocar.',
    'dubious-disc': 'Item de evolução. Faz Porygon2 evoluir para Porygon-Z ao trocar.',
    'dusk-ball': 'Poké Ball que funciona melhor à noite ou em cavernas.',
    'dusk-stone': 'Pedra de evolução para certos Pokémon, como Murkrow e Misdreavus.',
    'eject-button': 'Troca o Pokémon automaticamente quando atingido.',
    'electirizer': 'Item de evolução. Faz Electabuzz evoluir para Electivire ao trocar.',
    'elixir': 'Restaura 10 PP de todos os golpes.',
    'energy-powder': 'Medicamento amargo que restaura 60 HP.',
    'escape-rope': 'Item que permite escapar instantaneamente de cavernas.',
    'ether': 'Restaura 10 PP de um golpe.',
    'eviolite': 'Aumenta a Defesa e Def. Esp. de Pokémon que ainda podem evoluir.',
    'expert-belt': 'Aumenta o dano de golpes super efetivos em 20%.',
    'fire-stone': 'Pedra de evolução para certos Pokémon do tipo Fogo.',
    'flame-orb': 'Causa queimadura no portador durante a batalha.',
    'float-stone': 'Reduz pela metade o peso do Pokémon que segura.',
    'focus-band': 'Pode impedir que o Pokémon desmaie com 1 HP (chance de 10%).',
    'focus-sash': 'Impede nocaute em um golpe se o HP estiver cheio. Uso único.',
    'fresh-water': 'Água fresca que restaura 30 HP.',
    'full-heal': 'Cura todos os problemas de status de um Pokémon.',
    'full-restore': 'Restaura totalmente o HP e cura todos os status.',
    'great-ball': 'Poké Ball com taxa de captura melhor que a Poké Ball comum.',
    'grip-claw': 'Prolonga a duração de golpes que prendem para 7 turnos.',
    'guard-spec': 'Impede a redução de stats por 5 turnos numa batalha.',
    'hard-stone': 'Aumenta o poder de golpes do tipo Pedra.',
    'heal-ball': 'Poké Ball que cura totalmente o Pokémon capturado.',
    'heal-powder': 'Medicamento amargo que cura todos os problemas de status.',
    'heat-rock': 'Prolonga a duração do sol intenso quando segurado.',
    'heavy-ball': 'Poké Ball que funciona melhor em Pokémon pesados.',
    'hp-up': 'Aumenta os pontos base de HP de um Pokémon.',
    'hyper-potion': 'Restaura 120 HP de um Pokémon.',
    'ice-heal': 'Cura o congelamento de um Pokémon.',
    'ice-stone': 'Pedra de evolução para certos Pokémon do tipo Gelo.',
    'icy-rock': 'Prolonga a duração do granizo quando segurado.',
    'iron': 'Aumenta os pontos base de Defesa de um Pokémon.',
    'kings-rock': 'Pode fazer o oponente recuar ao atacar. Item de evolução para Slowpoke e Poliwhirl.',
    'lagging-tail': 'Faz o portador agir por último.',
    'leaf-stone': 'Pedra de evolução para certos Pokémon do tipo Planta.',
    'leftovers': 'Restaura 1/16 do HP máximo a cada turno.',
    'lemonade': 'Limonada que restaura 70 HP.',
    'level-ball': 'Poké Ball que funciona melhor se seu Pokémon tiver nível maior que o alvo.',
    'life-orb': 'Aumenta o dano dos golpes em 30%, mas perde 10% do HP por ataque.',
    'light-ball': 'Dobra o Ataque e Atq. Esp. de Pikachu quando segurado.',
    'light-clay': 'Prolonga a duração de Light Screen e Reflect para 8 turnos.',
    'love-ball': 'Poké Ball que funciona melhor em Pokémon do gênero oposto.',
    'lucky-egg': 'Aumenta os pontos de experiência ganhos em 50%.',
    'lucky-punch': 'Aumenta a chance de acerto crítico de Chansey.',
    'lure-ball': 'Poké Ball que funciona melhor em Pokémon pescados.',
    'lure': 'Faz Pokémon selvagens aparecerem com mais frequência.',
    'luxury-ball': 'Poké Ball que faz o Pokémon capturado ficar mais amigável.',
    'macho-brace': 'Dobra os EVs ganhos, mas reduz a Velocidade.',
    'magmarizer': 'Item de evolução. Faz Magmar evoluir para Magmortar ao trocar.',
    'magnet': 'Aumenta o poder de golpes do tipo Elétrico.',
    'master-ball': 'A melhor Poké Ball. Captura qualquer Pokémon sem falha.',
    'max-elixir': 'Restaura todos os PP de todos os golpes.',
    'max-ether': 'Restaura todos os PP de um golpe.',
    'max-potion': 'Restaura totalmente o HP de um Pokémon.',
    'max-revive': 'Revive um Pokémon desmaiado com HP total.',
    'mental-herb': 'Cura restrições como Encore, Taunt e Disable uma vez.',
    'metal-coat': 'Aumenta o poder de golpes do tipo Aço. Item de evolução para Onix e Scyther.',
    'metal-powder': 'Aumenta a Defesa de Ditto quando segurado.',
    'metronome': 'Aumenta o dano quando o mesmo golpe é usado consecutivamente.',
    'miracle-seed': 'Aumenta o poder de golpes do tipo Planta.',
    'moo-moo-milk': 'Leite nutritivo que restaura 100 HP.',
    'moon-ball': 'Poké Ball que funciona melhor em Pokémon que evoluem com Pedra da Lua.',
    'moon-stone': 'Pedra de evolução para certos Pokémon, como Clefairy e Nidorino.',
    'muscle-band': 'Aumenta o poder de golpes físicos em 10%.',
    'mystic-water': 'Aumenta o poder de golpes do tipo Água.',
    'nest-ball': 'Poké Ball que funciona melhor em Pokémon de nível baixo.',
    'net-ball': 'Poké Ball que funciona melhor em Pokémon dos tipos Água e Inseto.',
    'never-melt-ice': 'Aumenta o poder de golpes do tipo Gelo.',
    'normal-gem': 'Gema que aumenta o poder de um golpe do tipo Normal uma vez.',
    'nugget': 'Pepita de ouro que pode ser vendida por um preço alto.',
    'oran-berry': 'Restaura 10 HP quando segurada e o HP ficar baixo.',
    'oval-stone': 'Faz Happiny evoluir para Chansey ao subir de nível durante o dia.',
    'paralyze-heal': 'Cura a paralisia de um Pokémon.',
    'pecha-berry': 'Cura envenenamento quando segurada.',
    'persim-berry': 'Cura confusão quando segurada.',
    'poison-barb': 'Aumenta o poder de golpes do tipo Veneno.',
    'poke-ball': 'A Poké Ball mais básica para capturar Pokémon.',
    'potion': 'Restaura 20 HP de um Pokémon.',
    'power-herb': 'Permite usar golpes de dois turnos em um turno só. Uso único.',
    'premier-ball': 'Poké Ball comemorativa rara. Funciona como uma Poké Ball normal.',
    'pp-max': 'Aumenta os PP de um golpe ao máximo.',
    'pp-up': 'Aumenta os PP máximos de um golpe em 20%.',
    'protector': 'Item de evolução. Faz Rhydon evoluir para Rhyperior ao trocar.',
    'protein': 'Aumenta os pontos base de Ataque de um Pokémon.',
    'quick-ball': 'Poké Ball que funciona melhor se usada no início da batalha.',
    'quick-claw': 'Às vezes permite ao portador agir primeiro.',
    'quick-powder': 'Dobra a Velocidade de Ditto quando segurado.',
    'rare-candy': 'Faz um Pokémon subir um nível instantaneamente.',
    'rawst-berry': 'Cura queimadura quando segurada.',
    'razor-claw': 'Aumenta a chance de acerto crítico. Item de evolução para Sneasel.',
    'razor-fang': 'Pode fazer o oponente recuar. Item de evolução para Gligar.',
    'reaper-cloth': 'Item de evolução. Faz Dusclops evoluir para Dusknoir ao trocar.',
    'red-card': 'Força o oponente a trocar de Pokémon quando atingido.',
    'repeat-ball': 'Poké Ball que funciona melhor em Pokémon já capturados antes.',
    'revive': 'Revive um Pokémon desmaiado com metade do HP.',
    'ring-target': 'Faz o portador perder suas imunidades de tipo.',
    'rocky-helmet': 'Causa dano ao oponente que fizer contato direto.',
    'sacred-ash': 'Revive e cura totalmente todos os Pokémon desmaiados do time.',
    'safety-goggles': 'Protege contra dano de clima e golpes de pó/esporo.',
    'scope-lens': 'Aumenta a chance de acerto crítico.',
    'sea-incense': 'Aumenta o poder de golpes do tipo Água.',
    'sharp-beak': 'Aumenta o poder de golpes do tipo Voador.',
    'shed-shell': 'Permite trocar mesmo quando preso por golpes como Mean Look.',
    'shell-bell': 'Restaura HP quando o portador causa dano.',
    'shiny-stone': 'Pedra de evolução para certos Pokémon, como Togetic e Roselia.',
    'silk-scarf': 'Aumenta o poder de golpes do tipo Normal.',
    'silver-powder': 'Aumenta o poder de golpes do tipo Inseto.',
    'sitrus-berry': 'Restaura 25% do HP máximo quando o HP ficar baixo.',
    'smoke-ball': 'Permite fugir de qualquer batalha contra Pokémon selvagens.',
    'smooth-rock': 'Prolonga a duração da tempestade de areia quando segurado.',
    'soda-pop': 'Refrigerante que restaura 50 HP.',
    'soft-sand': 'Aumenta o poder de golpes do tipo Terrestre.',
    'soul-dew': 'Aumenta o Atq. Esp. e Def. Esp. de Latios e Latias.',
    'spell-tag': 'Aumenta o poder de golpes do tipo Fantasma.',
    'stardust': 'Poeira estelar que pode ser vendida por um preço moderado.',
    'star-piece': 'Fragmento de estrela que pode ser vendido por um preço alto.',
    'stick': 'Aumenta a chance de acerto crítico de Farfetchd.',
    'sticky-barb': 'Causa dano ao portador a cada turno e pode passar para quem fizer contato.',
    'sun-stone': 'Pedra de evolução para certos Pokémon, como Gloom e Sunkern.',
    'super-potion': 'Restaura 60 HP de um Pokémon.',
    'super-repel': 'Repelente que afasta Pokémon selvagens por 200 passos.',
    'thunder-stone': 'Pedra de evolução para certos Pokémon do tipo Elétrico.',
    'timer-ball': 'Poké Ball que fica melhor conforme os turnos passam.',
    'tiny-mushroom': 'Cogumelo pequeno que pode ser vendido por um preço baixo.',
    'toxic-orb': 'Causa envenenamento grave no portador durante a batalha.',
    'twisted-spoon': 'Aumenta o poder de golpes do tipo Psíquico.',
    'ultra-ball': 'Poké Ball com taxa de captura superior à Great Ball.',
    'up-grade': 'Item de evolução. Faz Porygon evoluir para Porygon2 ao trocar.',
    'water-stone': 'Pedra de evolução para certos Pokémon do tipo Água.',
    'weakness-policy': 'Aumenta muito o Ataque e Atq. Esp. quando o portador é atingido por um golpe super efetivo.',
    'white-herb': 'Restaura stats reduzidos uma vez.',
    'wide-lens': 'Aumenta a precisão dos golpes em 10%.',
    'wise-glasses': 'Aumenta o poder de golpes especiais em 10%.',
    'x-accuracy': 'Aumenta a precisão em batalha.',
    'x-attack': 'Aumenta o Ataque temporariamente em batalha.',
    'x-defense': 'Aumenta a Defesa temporariamente em batalha.',
    'x-sp-atk': 'Aumenta o Atq. Esp. temporariamente em batalha.',
    'x-sp-def': 'Aumenta a Def. Esp. temporariamente em batalha.',
    'x-speed': 'Aumenta a Velocidade temporariamente em batalha.',
    'zinc': 'Aumenta os pontos base de Def. Esp. de um Pokémon.',
    'zoom-lens': 'Aumenta a precisão se o portador agir por último.',
};

const MANUAL_MOVES = {
    'absorb': 'Drena metade do dano causado como HP.',
    'aerial-ace': 'Um ataque extremamente veloz e inevitável.',
    'agility': 'Aumenta bruscamente a Velocidade do usuário.',
    'amnesia': 'Aumenta bruscamente a Def. Esp. do usuário.',
    'aqua-jet': 'O usuário avança contra o alvo em alta velocidade. Sempre ataca primeiro.',
    'aqua-ring': 'O usuário se envolve em um véu de água. Restaura um pouco de HP a cada turno.',
    'aqua-step': 'O usuário brinca com o alvo e ataca com passos de dança leves. Também aumenta a Velocidade do usuário.',
    'aqua-tail': 'O usuário ataca balançando sua cauda como uma onda violenta.',
    'astral-barrage': 'Ataque terrível com fantasmas.',
    'aura-sphere': 'Explosão de aura que nunca erra.',
    'aurora-beam': 'Raio de luz colorida. Pode reduzir o Ataque.',
    'bite': 'O usuário morde o alvo. Pode causar recuo.',
    'blizzard': 'Uma tempestade de neve feroz. Pode congelar.',
    'body-press': 'Ataque pesado que usa a Defesa para calcular o dano.',
    'brave-bird': 'O usuário mergulha sobre o alvo. Causa dano de recuo ao usuário.',
    'brick-break': 'Um golpe que quebra barreiras como Reflect ou Light Screen.',
    'bug-buzz': 'Vibra as asas para gerar som. Pode reduzir a Def. Especial.',
    'bulk-up': 'Fortalece o corpo para aumentar Ataque e Defesa.',
    'bullet-punch': 'Soco rápido como uma bala. Sempre ataca primeiro.',
    'calm-mind': 'Foca a mente para aumentar Atq. Especial e Def. Especial.',
    'close-combat': 'Ataque de perto sem medo, mas reduz a Defesa e Def. Especial do usuário.',
    'crunch': 'Um ataque que pode reduzir a Def. Especial.',
    'dark-pulse': 'Libera uma aura horrível. Pode causar recuo.',
    'dazzling-gleam': 'Uma luz brilhante que atinge todos os oponentes.',
    'defog': 'Vento que limpa o campo de perigos e neblina.',
    'double-edge': 'Um avanço imprudente que causa dano de recuo.',
    'draco-meteor': 'Cometas caem do céu. Reduz muito o Atq. Especial do usuário.',
    'dragon-claw': 'O usuário corta o alvo com garras de dragão.',
    'dragon-dance': 'Dança que aumenta Ataque e Velocidade.',
    'dragon-pulse': 'O usuário ataca com uma onda de choque dracônica.',
    'drain-punch': 'Um soco que drena o HP do alvo.',
    'drill-run': 'Gira como uma broca para atacar. Alta chance de acerto crítico.',
    'earth-power': 'Erupção de terra sob o alvo. Pode reduzir a Def. Especial.',
    'earthquake': 'O usuário provoca um terremoto que atinge todos ao redor.',
    'encore': 'Faz o alvo repetir o último golpe.',
    'energy-ball': 'Esfera de energia da natureza. Pode reduzir a Def. Especial.',
    'extreme-speed': 'Um ataque extremamente rápido com prioridade altíssima.',
    'facade': 'Dobra o poder se o usuário estiver queimado, envenenado ou paralisado.',
    'fake-out': 'Ataca primeiro e garante recuo, mas só funciona no 1º turno.',
    'fire-blast': 'Explosão de fogo intensa. Pode queimar.',
    'fire-punch': 'Soco de fogo. Pode queimar.',
    'flamethrower': 'Um sopro intenso de fogo. Pode causar queimadura.',
    'flare-blitz': 'O usuário se envolve em chamas e avança. Causa recuo e pode queimar.',
    'flash-cannon': 'Concentra energia de luz. Pode reduzir a Def. Especial.',
    'focus-blast': 'Explosão mental concentrada. Pode reduzir a Def. Especial.',
    'frustration': 'O poder depende de quão pouco o Pokémon gosta do treinador.',
    'giga-drain': 'Drena o HP do alvo.',
    'gigaton-hammer': 'Martelo gigante que não pode ser usado em sequência.',
    'glacial-lance': 'Ataque com uma lança de gelo imensa.',
    'haze': 'Anula todas as mudanças de atributos em campo.',
    'head-smash': 'Uma cabeçada de poder extremo que causa grande recuo.',
    'helping-hand': 'Aumenta o dano do ataque de um aliado.',
    'high-jump-kick': 'Um chute saltado muito forte, mas o usuário se fere se errar.',
    'hurricane': 'Vento feroz que pode causar confusão.',
    'hydro-pump': 'Jato de água sob extrema pressão.',
    'ice-beam': 'Um raio de gelo. Pode congelar o alvo.',
    'ice-punch': 'Soco de gelo. Pode congelar.',
    'ice-shard': 'Atira pedaços de gelo. Sempre ataca primeiro.',
    'iron-head': 'Ataque com uma cabeça dura como metal. Pode causar recuo.',
    'knock-off': 'Derruba o item do alvo, causando muito mais dano se ele tiver um item.',
    'leaf-storm': 'Tempestade de folhas. Reduz muito o Atq. Especial do usuário.',
    'leech-seed': 'Planta sementes que drenam HP do alvo a cada turno.',
    'light-screen': 'Reduz dano especial recebido por 5 turnos.',
    'liquidation': 'Ataque com jato de água sob pressão. Pode reduzir a Defesa do alvo.',
    'mach-punch': 'Soco disparado na velocidade do som. Sempre ataca primeiro.',
    'make-it-rain': 'Chuva de moedas de ouro que reduz Atq. Especial.',
    'moonblast': 'Usa o poder da lua. Pode reduzir o Atq. Especial do alvo.',
    'moonlight': 'Restaura HP com a luz da lua.',
    'morning-sun': 'Restaura HP com a luz do sol.',
    'nasty-plot': 'Plano ruim que aumenta muito o Atq. Especial.',
    'outrage': 'Ataca freneticamente por 2-3 turnos, ficando confuso depois.',
    'overheat': 'Calor extremo que reduz muito o Atq. Especial do usuário.',
    'play-rough': 'O usuário brinca agressivamente. Pode reduzir o Ataque do alvo.',
    'poison-jab': 'Ataca com um tentáculo venenoso. Pode envenenar.',
    'pounce': 'O usuário salta sobre o alvo, reduzindo a Velocidade dele.',
    'power-gem': 'Dispara luz de gemas brilhantes.',
    'protect': 'Impede todos os ataques contra o usuário neste turno.',
    'psychic': 'Uma forte força telecinética. Pode reduzir a Def. Especial.',
    'quick-attack': 'O usuário avança em alta velocidade. Sempre ataca primeiro.',
    'quiver-dance': 'Dança que aumenta Atq. Esp, Def. Esp e Velocidade.',
    'rapid-spin': 'Gira para limpar perigos e aumentar Velocidade.',
    'recover': 'Restaura metade do HP.',
    'reflect': 'Reduz dano físico recebido por 5 turnos.',
    'rest': 'Dorme por 2 turnos para recuperar totalmente.',
    'return': 'O poder depende de quão amigável o Pokémon é com o treinador.',
    'rock-slide': 'Grandes pedras caem no alvo. Pode causar recuo.',
    'roost': 'Pousa para restaurar metade do HP.',
    'scald': 'Água fervente que tem alta chance de queimar o alvo.',
    'scratch': 'O usuário arranha o alvo com garras afiadas.',
    'shadow-ball': 'Lança uma esfera de escuridão. Pode reduzir a Def. Especial.',
    'shadow-claw': 'Corte com garras das sombras. Alta chance de acerto crítico.',
    'shadow-sneak': 'Ataca das sombras. Sempre ataca primeiro.',
    'shell-smash': 'Quebra a concha para aumentar muito Atq, Atq. Esp e Velocidade.',
    'signal-beam': 'Raio de luz estranho. Pode causar confusão.',
    'sleep-powder': 'Faz o alvo dormir.',
    'sludge-bomb': 'Lama tóxica atirada no alvo. Pode envenenar.',
    'spikes': 'Espalha espinhos que ferem quem entra na batalha.',
    'spore': 'Faz o alvo dormir (100% de chance).',
    'stealth-rock': 'Espalha pedras que ferem quem entra na batalha.',
    'sticky-web': 'Teia que reduz a Velocidade de quem entra.',
    'stone-edge': 'Ataque com pedras afiadas. Alta chance de acerto crítico.',
    'thunder-wave': 'Onda de choque que paralisa o alvo.',
    'thunderbolt': 'Uma descarga elétrica poderosa. Pode paralisar.',
    'toxic': 'Envenena gravemente o alvo, com dano crescente.',
    'toxic-spikes': 'Espalha espinhos tóxicos que envenenam quem entra.',
    'u-turn': 'Ataca e troca de Pokémon imediatamente.',
    'volt-switch': 'Ataque elétrico que troca o usuário por outro Pokémon.',
    'waterfall': 'Ataque com cachoeira de água. Pode causar recuo.',
    'will-o-wisp': 'Chama fantasmagórica que causa queimadura no alvo.',
    'zen-headbutt': 'Cabeçada com poder psíquico. Pode causar recuo.',
};

async function main() {
    console.log('🔄 Gerando traduções COMPLETAS...');
    console.log(`   Hora: ${new Date().toLocaleString()}`);

    // === ITEMS ===
    console.log('\n=== BUSCANDO ITENS ===');
    const itemList = await fetchAllPaginated('item');
    console.log('  Buscando detalhes...');
    const itemDetails = await fetchInBatches(itemList.map(i => i.url), BATCH_SIZE);

    let itemOutput = `export const ptBRItemTranslations: Record<string, { name: string; description: string }> = {\n`;
    let manualItemCount = 0;

    for (const item of itemDetails.sort((a, b) => a.name.localeCompare(b.name))) {
        const slug = item.name;
        const displayName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        let desc;
        if (MANUAL_ITEMS[slug]) {
            desc = MANUAL_ITEMS[slug];
            manualItemCount++;
        } else {
            desc = getEnDesc(item.flavor_text_entries, 'flavor');
            if (!desc) desc = getEnDesc(item.effect_entries, 'effect');
            if (!desc) desc = `Item Pokémon: ${displayName}.`;
        }

        itemOutput += `  '${slug}': { name: '${esc(displayName)}', description: '${esc(desc)}' },\n`;
    }
    itemOutput += `};\n`;

    const itemPath = path.join(__dirname, '..', 'src', 'itemTranslations.ts');
    fs.writeFileSync(itemPath, itemOutput, 'utf8');
    console.log(`  ✅ ${itemDetails.length} itens (${manualItemCount} em PT-BR manual)`);

    // === MOVES ===
    console.log('\n=== BUSCANDO GOLPES ===');
    const moveList = await fetchAllPaginated('move');
    console.log('  Buscando detalhes...');
    const moveDetails = await fetchInBatches(moveList.map(m => m.url), BATCH_SIZE);

    let moveOutput = `export const ptBRMoveTranslations: Record<string, { description: string }> = {\n`;
    let manualMoveCount = 0;

    for (const move of moveDetails.sort((a, b) => a.name.localeCompare(b.name))) {
        const slug = move.name;

        let desc;
        if (MANUAL_MOVES[slug]) {
            desc = MANUAL_MOVES[slug];
            manualMoveCount++;
        } else {
            desc = getEnDesc(move.flavor_text_entries, 'flavor');
            if (!desc) desc = getEnDesc(move.effect_entries, 'effect');
            if (!desc) {
                const displayName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                desc = `Golpe Pokémon: ${displayName}.`;
            }
        }

        moveOutput += `  '${slug}': { description: '${esc(desc)}' },\n`;
    }
    moveOutput += `};\n`;

    const movePath = path.join(__dirname, '..', 'src', 'moveTranslations.ts');
    fs.writeFileSync(movePath, moveOutput, 'utf8');
    console.log(`  ✅ ${moveDetails.length} golpes (${manualMoveCount} em PT-BR manual)`);

    console.log('\n========================================');
    console.log(`✅ CONCLUÍDO!`);
    console.log(`   Itens: ${itemDetails.length} (${manualItemCount} PT-BR)`);
    console.log(`   Golpes: ${moveDetails.length} (${manualMoveCount} PT-BR)`);
    console.log('========================================');
}

main().catch(err => { console.error('❌ Erro:', err); process.exit(1); });
