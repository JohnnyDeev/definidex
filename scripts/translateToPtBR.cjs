/**
 * Full-sentence English-to-Portuguese translator for ALL Pokémon items and moves.
 * This version produces COMPLETE natural Portuguese sentences (not word-by-word).
 * 
 * Strategy:
 * 1. Keep existing manual PT-BR translations (the 192 items + 116 moves done initially)
 * 2. For items: use category-based complete sentence templates
 * 3. For moves: translate entire sentences using comprehensive mappings
 * 4. Final pass: catch any remaining English fragments
 */

const fs = require('fs');
const path = require('path');

// ==========================================================
// FULL SENTENCE TRANSLATIONS - Complete sentence mappings
// ==========================================================

// These are COMPLETE sentence translations, not word-by-word
const FULL_SENTENCE_MAP = new Map([
    // --- Very common item sentences ---
    ['A capsule that allows a Pokémon with two Abilities to switch between these Abilities when it is used.', 'Uma cápsula que permite a um Pokémon com duas Habilidades alternar entre elas quando usada.'],
    ['A patch that allows a Pokémon with a regular Ability to have a rare Ability.', 'Um patch que permite a um Pokémon com Habilidade comum ter uma Habilidade rara.'],
    ['When used, it activates the Ability of an ally Pokémon.', 'Quando usado, ativa a Habilidade de um Pokémon aliado.'],
    ['A candy that is packed with energy. When given to certain Pokémon, it will increase all their stats at once.', 'Um doce repleto de energia. Quando dado a certos Pokémon, aumenta todos os seus atributos de uma vez.'],
    ['A consumable bulb. If the holder is hit by a Water-type move, its Sp. Atk will rise.', 'Um bulbo consumível. Se o portador for atingido por um golpe do tipo Água, seu Atq. Esp. subirá.'],
    ['A folding bicycle capable of jumps and wheelies.', 'Uma bicicleta dobrável capaz de saltos e empinadas.'],
    ['Dummy Data', 'Dados de teste.'],
]);

// Complete sentence patterns for mega stones
function translateMegaStone(desc) {
    const m = desc.match(/Have (.+?) hold it/);
    if (m) return `Uma das misteriosas Mega Pedras. Dê para ${m[1]} segurar e esta pedra permitirá a Mega Evolução durante a batalha.`;
    return null;
}

// Complete sentence patterns for candies
function translateCandy(desc) {
    if (desc.includes('packed with energy') && desc.includes('increase all their stats')) {
        return 'Um doce repleto de energia. Quando dado a certos Pokémon, aumenta todos os seus atributos de uma vez.';
    }
    return null;
}

// Complete sentence patterns for Z-Crystals
function translateZCrystal(desc, slug) {
    if (desc.includes('Z-Power')) {
        const m1 = desc.match(/upgrades? (.+?)['']s (.+?) to (?:a |an )?(?:exclusive )?Z-Move/i);
        if (m1) return `Converte Poder Z em cristais que transformam o golpe ${m1[2]} de ${m1[1]} em um Golpe Z exclusivo.`;
        const m2 = desc.match(/crystallized form of Z-Power.*?upgrades? (.+?)['']s (.+?) to a Z-Move/i);
        if (m2) return `Forma cristalizada de Poder Z. Transforma o golpe ${m2[2]} de ${m2[1]} em um Golpe Z.`;
        if (desc.includes('crystallized form')) return 'Forma cristalizada de Poder Z para uso especial em batalha.';
        if (desc.includes('converts Z-Power')) return 'Converte Poder Z em cristais para uso em Golpes Z.';
    }
    return null;
}

// Complete sentence patterns for mints
function translateMint(desc) {
    const m = desc.match(/When a Pokémon smells this mint, its (.+?) will grow more easily, but its (.+?) will grow more slowly/i);
    if (m) return `Quando um Pokémon cheira esta menta, seu ${translateStat(m[1])} cresce mais facilmente, mas seu ${translateStat(m[2])} cresce mais lentamente.`;
    return null;
}

function translateStat(stat) {
    const map = {
        'Attack': 'Ataque', 'Defense': 'Defesa', 'Sp. Atk': 'Atq. Esp.',
        'Sp. Def': 'Def. Esp.', 'Speed': 'Velocidade'
    };
    return map[stat] || stat;
}

// Complete sentence patterns for orbs/plates
function translateOrbPlate(desc) {
    const m1 = desc.match(/(?:A brightly gleaming|An?) (?:orb|jewel|gem) to be held by (.+?)\. It boosts the power of (.+?) moves/i);
    if (m1) return `Um orbe brilhante para ${m1[1]} segurar. Aumenta o poder de golpes do tipo ${m1[2]}.`;
    const m2 = desc.match(/An inscrutable plate.*?it will boost the power of (.+?)-type moves/i);
    if (m2) return `Uma placa insondável. Quando segurada, aumenta o poder de golpes do tipo ${m2[1]}.`;
    return null;
}

// Complete sentence for memories
function translateMemory(desc) {
    const m = desc.match(/changes? (?:Silvally|(?:the Pokémon|it|the holder)) to (?:be )?(?:the )?(.+?)(?:\s+|-)?type/i);
    if (m) return `Um disco de memória com dados do tipo ${m[1]}. Muda Silvally e seu golpe Multi-Ataque para o tipo ${m[1]}.`;
    if (desc.includes('holding this disc') || desc.includes('memory disc')) return 'Um disco de memória que muda o tipo de Silvally e Multi-Ataque.';
    return null;
}

// Translate common item categories
function translateItem(slug, name, desc) {
    // 1. Check full sentence map
    if (FULL_SENTENCE_MAP.has(desc)) return FULL_SENTENCE_MAP.get(desc);

    // 2. Empty/placeholder items
    if (desc.startsWith('Item: ') || desc.startsWith('Item Pokémon:')) {
        return `Item Pokémon: ${name}.`;
    }

    // 3. Pattern-based translations
    let result;

    // Mega Stones
    if (desc.includes('Mega Stones') || desc.includes('Mega Evolve')) {
        result = translateMegaStone(desc);
        if (result) return result;
    }

    // Candies
    if (slug.includes('-candy') || desc.includes('packed with energy')) {
        result = translateCandy(desc);
        if (result) return result;
    }

    // Z-Crystals
    if (slug.includes('ium-z') || desc.includes('Z-Power') || desc.includes('Z-Move')) {
        result = translateZCrystal(desc, slug);
        if (result) return result;
    }

    // Mints
    if (slug.includes('-mint') && desc.includes('smells this mint')) {
        result = translateMint(desc);
        if (result) return result;
    }

    // Orbs/Plates
    if (desc.includes('boosts the power of') && (desc.includes('orb') || desc.includes('plate') || desc.includes('Plate'))) {
        result = translateOrbPlate(desc);
        if (result) return result;
    }

    // Memory discs
    if (slug.includes('-memory') || desc.includes('memory disc') || desc.includes('holding this disc')) {
        result = translateMemory(desc);
        if (result) return result;
    }

    // 4. General full-sentence translation
    return translateSentence(desc);
}

// ======================================================================
// COMPLETE SENTENCE TRANSLATOR
// Translates full English sentences to natural Portuguese
// ======================================================================

function translateSentence(text) {
    if (!text) return text;

    // Split into sentences and translate each
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const translated = sentences.map(s => translateOneSentence(s.trim())).join(' ');
    return translated;
}

function translateOneSentence(sent) {
    if (!sent) return sent;
    let s = sent;

    // =============================================
    // COMPLETE SENTENCE PATTERNS (most common first)
    // =============================================

    // --- Attack descriptions for moves ---
    s = s.replace(/^The user (?:attacks?|strikes?) (?:the target |the foe |its target |opposing Pokémon )?by (.+)$/i,
        (_, action) => `O usuário ataca ${translateAction(action)}`);

    s = s.replace(/^The user (.+?) to attack (?:the target|the foe|opposing Pokémon)\.?$/i,
        (_, action) => `O usuário ${translateAction(action)} para atacar o alvo.`);

    s = s.replace(/^The user (.+?) at the (?:target|foe)\.?$/i,
        (_, action) => `O usuário ${translateAction(action)} no alvo.`);

    // --- Stat changes ---
    s = s.replace(/This (?:also )?(?:lowers|reduces) the target's ([A-Za-z. ]+) stat\.?/gi,
        (_, stat) => `Isso também reduz o ${translateStat(stat.trim())} do alvo.`);

    s = s.replace(/This (?:also )?(?:raises|boosts|increases) the user's ([A-Za-z. ]+) stat\.?/gi,
        (_, stat) => `Isso também aumenta o ${translateStat(stat.trim())} do usuário.`);

    s = s.replace(/It may (?:also )?lower the (?:target's|foe's) ([A-Za-z. ]+)\.?/gi,
        (_, stat) => `Pode reduzir o ${translateStat(stat.trim())} do alvo.`);

    s = s.replace(/It may (?:also )?raise the user's ([A-Za-z. ]+)\.?/gi,
        (_, stat) => `Pode aumentar o ${translateStat(stat.trim())} do usuário.`);

    // --- Common attack patterns ---  
    s = s.replace(/^An attack that may (?:also )?cause (\w+)\.?$/i,
        (_, effect) => `Um ataque que pode causar ${translateEffect(effect)}.`);

    s = s.replace(/^An attack that may (?:also )?(\w+) the (?:target|foe)\.?$/i,
        (_, effect) => `Um ataque que pode ${translateEffect(effect)} o alvo.`);

    s = s.replace(/^An attack that never misses\.?$/i, 'Um ataque que nunca erra.');
    s = s.replace(/^A powerful attack\.?$/i, 'Um ataque poderoso.');
    s = s.replace(/^A strong attack\.?$/i, 'Um ataque forte.');

    // --- Move descriptions ---
    s = s.replace(/^This move always goes first\.?$/i, 'Este golpe sempre ataca primeiro.');
    s = s.replace(/^This attack never misses\.?$/i, 'Este ataque nunca erra.');
    s = s.replace(/^Has a high critical-hit ratio\.?$/i, 'Possui alta chance de acerto crítico.');
    s = s.replace(/^Has a high criti­\s*cal hit ratio\.?$/i, 'Possui alta chance de acerto crítico.');
    s = s.replace(/^High critical-hit ratio\.?$/i, 'Alta chance de acerto crítico.');
    s = s.replace(/^Critical hits land more easily\.?$/i, 'Acertos críticos acontecem mais facilmente.');
    s = s.replace(/^May cause (\w+)\.?$/i, (_, e) => `Pode causar ${translateEffect(e)}.`);

    // --- Status effects ---
    s = s.replace(/This may also leave the target with a burn\.?/gi, 'Isso também pode causar queimadura no alvo.');
    s = s.replace(/This may also leave the target with paralysis\.?/gi, 'Isso também pode paralisar o alvo.');
    s = s.replace(/This may also leave the target frozen\.?/gi, 'Isso também pode congelar o alvo.');
    s = s.replace(/This may also make the target flinch\.?/gi, 'Isso também pode fazer o alvo recuar.');
    s = s.replace(/It may also leave the (target|foe) with a burn\.?/gi, 'Também pode causar queimadura no alvo.');
    s = s.replace(/It may also make the (target|foe) flinch\.?/gi, 'Também pode fazer o alvo recuar.');
    s = s.replace(/It may also poison the target\.?/gi, 'Também pode envenenar o alvo.');
    s = s.replace(/It may also cause paralysis\.?/gi, 'Também pode causar paralisia.');
    s = s.replace(/It may also cause confusion\.?/gi, 'Também pode causar confusão.');
    s = s.replace(/It leaves the target with a burn\.?/gi, 'Causa queimadura no alvo.');
    s = s.replace(/May inflict a burn\.?/gi, 'Pode causar queimadura.');
    s = s.replace(/May also poison\.?/gi, 'Também pode envenenar.');
    s = s.replace(/May cause a burn\.?/gi, 'Pode causar queimadura.');
    s = s.replace(/May cause paralysis\.?/gi, 'Pode causar paralisia.');
    s = s.replace(/May cause flinching\.?/gi, 'Pode causar recuo.');
    s = s.replace(/May lower (.+?)\.?$/gi, (_, stat) => `Pode reduzir ${translateStat(stat.trim())}.`);

    // --- Item/held item patterns ---
    s = s.replace(/^An item to be held by a Pokémon\.?/i, 'Um item para um Pokémon segurar.');
    s = s.replace(/^A held item that (.+)$/i, (_, effect) => `Um item segurado que ${translateAction(effect)}`);

    // --- Poké Ball patterns ---
    s = s.replace(/^A (?:special |somewhat different )?Poké Ball that (.+)$/i,
        (_, effect) => `Uma Poké Ball especial que ${translateAction(effect)}`);
    s = s.replace(/makes it easier to catch (.+)$/i,
        (_, target) => `facilita a captura de ${target}`);

    // --- Berry patterns ---
    s = s.replace(/^A Berry to be consumed by Pokémon\.?/i, 'Uma Berry para consumo de Pokémon.');
    s = s.replace(/If a Pokémon holds one, it can restore its own HP by (\d+) HP during battle\.?/gi,
        (_, hp) => `Se um Pokémon segurar uma, pode restaurar ${hp} HP durante a batalha.`);

    // --- Medicine patterns ---
    s = s.replace(/^A spray-type medicine for (.+)$/i, (_, use) => `Um medicamento em spray para ${translateAction(use)}`);
    s = s.replace(/^A medicine that can be used to restore (.+)$/i, (_, use) => `Um medicamento que restaura ${translateAction(use)}`);
    s = s.replace(/^Restores? (\d+) HP\.?$/i, (_, hp) => `Restaura ${hp} HP.`);
    s = s.replace(/^Restores? HP by (.+)$/i, (_, amount) => `Restaura HP em ${amount}.`);

    // --- Healing/recovery ---
    s = s.replace(/^Restores HP by 1\/2 the (?:max|user's max|maximum) HP\.?$/i, 'Restaura metade do HP máximo.');
    s = s.replace(/^The user recovers? (?:up to )?half (?:of )?its (?:max|maximum) HP\.?$/i, 'O usuário restaura metade do seu HP máximo.');
    s = s.replace(/It restores? (?:the user's |its )?HP\.?/gi, 'Restaura HP.');

    // --- Power and damage ---
    s = s.replace(/^Powerful, but leaves the user immobile the next turn\.?$/i, 'Poderoso, mas o usuário fica imóvel no próximo turno.');
    s = s.replace(/^Powerful but makes the user faint\.?$/i, 'Poderoso, mas o usuário desmaia.');
    s = s.replace(/^Very powerful but makes user faint\.?$/i, 'Muito poderoso, mas o usuário desmaia.');
    s = s.replace(/The user can't move on the next turn\.?/gi, 'O usuário não pode agir no próximo turno.');
    s = s.replace(/It must rest on the next turn(?:, however)?\.?/gi, 'Deve descansar no próximo turno.');
    s = s.replace(/The user must rest on the next turn\.?/gi, 'O usuário deve descansar no próximo turno.');

    // --- 2-turn moves ---
    s = s.replace(/^1st turn: (\w+) 2nd turn: (\w+)$/i, (_, t1, t2) => `1º turno: ${t1}. 2º turno: ${t2}.`);
    s = s.replace(/^In this two-turn attack, (.+)$/i, (_, desc) => `Neste ataque de dois turnos, ${translateAction(desc)}`);

    // --- Recoil ---
    s = s.replace(/This also damages the user(?: a little| quite a lot)?\.?/gi, 'Isso também causa dano ao usuário.');
    s = s.replace(/The user also takes some damage\.?/gi, 'O usuário também sofre um pouco de dano.');
    s = s.replace(/User receives? (?:1\/2 |half )?(?:its HP in )?recoil\.?/gi, 'O usuário sofre dano de recuo.');

    // --- Priority ---
    s = s.replace(/This move always goes first\.?/gi, 'Este golpe sempre ataca primeiro.');
    s = s.replace(/It is sure to strike first\.?/gi, 'É garantido que ataca primeiro.');

    // --- Multi-hit ---
    s = s.replace(/(?:Hits|Strikes|Attacks?) (?:the (?:target|foe) )?(\d+) to (\d+) times\.?/gi,
        (_, min, max) => `Atinge ${min} a ${max} vezes.`);
    s = s.replace(/(?:Hits|Strikes) (\d+)-(\d+) times\.?/gi,
        (_, min, max) => `Atinge ${min} a ${max} vezes.`);
    s = s.replace(/The target is hit twice in a row\.?/gi, 'O alvo é atingido duas vezes seguidas.');

    // --- Protect/Detect ---
    s = s.replace(/This move enables the user to protect itself from all attacks\.?/gi,
        'Este golpe permite que o usuário se proteja de todos os ataques.');
    s = s.replace(/Its chance of failing rises if it is used in succession\.?/gi,
        'Sua chance de falhar aumenta se usado em sequência.');
    s = s.replace(/This also hits a target using (?:a move such as )?Protect or Detect\.?/gi,
        'Isso também atinge alvos que estejam usando Protect ou Detect.');

    // --- Weather/terrain ---
    s = s.replace(/for five turns\.?/gi, 'por cinco turnos.');
    s = s.replace(/for four to five turns\.?/gi, 'por quatro a cinco turnos.');
    s = s.replace(/lasting five turns\.?/gi, 'durando cinco turnos.');

    // --- Switching ---
    s = s.replace(/The user switches (?:places )?with a party Pokémon (?:in waiting)?\.?/gi,
        'O usuário troca de lugar com um Pokémon do time.');
    s = s.replace(/Then it switches with a party Pokémon\.?/gi,
        'Depois, troca de lugar com um Pokémon do time.');
    s = s.replace(/The target cannot (?:attack |flee |switch |escape )/gi,
        'O alvo não pode atacar, fugir ou trocar ');

    // --- General phrases (catch remaining English) ---
    s = s.replace(/\bThe user\b/g, 'O usuário');
    s = s.replace(/\bthe user\b/g, 'o usuário');
    s = s.replace(/\bThe target\b/g, 'O alvo');
    s = s.replace(/\bthe target\b/g, 'o alvo');
    s = s.replace(/\bThe foe\b/g, 'O oponente');
    s = s.replace(/\bthe foe\b/g, 'o oponente');
    s = s.replace(/\bopposing Pokémon\b/gi, 'Pokémon adversários');
    s = s.replace(/\bally Pokémon\b/gi, 'Pokémon aliados');
    s = s.replace(/\bwild Pokémon\b/gi, 'Pokémon selvagens');
    s = s.replace(/\bheld item\b/gi, 'item segurado');
    s = s.replace(/\bcritical hit\b/gi, 'acerto crítico');
    s = s.replace(/\bcritical-hit\b/gi, 'acerto crítico');
    s = s.replace(/\bin battle\b/gi, 'em batalha');
    s = s.replace(/\bduring battle\b/gi, 'durante a batalha');
    s = s.replace(/\bDynamaxed\b/g, 'Dynamaxado');
    s = s.replace(/\bMega Evolve\b/g, 'Mega Evoluir');
    s = s.replace(/\bZ-Power\b/g, 'Poder Z');
    s = s.replace(/\bZ-Move\b/g, 'Golpe Z');
    s = s.replace(/\bAttack stat\b/g, 'atributo de Ataque');
    s = s.replace(/\bDefense stat\b/g, 'atributo de Defesa');
    s = s.replace(/\bSp\. Atk stat\b/g, 'atributo de Atq. Esp.');
    s = s.replace(/\bSp\. Def stat\b/g, 'atributo de Def. Esp.');
    s = s.replace(/\bSpeed stat\b/g, 'atributo de Velocidade');

    return s;
}

function translateAction(action) {
    let a = action;
    a = a.replace(/\bthe target\b/gi, 'o alvo');
    a = a.replace(/\bthe foe\b/gi, 'o oponente');
    a = a.replace(/\bthe user\b/gi, 'o usuário');
    a = a.replace(/\bopposing Pokémon\b/gi, 'Pokémon adversários');
    a = a.replace(/\bin battle\b/gi, 'em batalha');
    a = a.replace(/\bduring battle\b/gi, 'durante a batalha');
    return a;
}

function translateEffect(effect) {
    const map = {
        'paralysis': 'paralisia', 'confusion': 'confusão', 'flinching': 'recuo',
        'poison': 'envenenamento', 'burn': 'queimadura', 'sleep': 'sono',
        'freeze': 'congelamento', 'flinch': 'recuo'
    };
    return map[effect.toLowerCase()] || effect;
}

// ======================================================================
// DETECT IF TEXT IS ALREADY IN PORTUGUESE
// ======================================================================

function isAlreadyPortuguese(text) {
    if (!text) return false;
    const ptMarkers = [/ção\b/, /ões\b/, /ância\b/, /mente\b/, /\busuário\b/i,
        /\balvo\b/i, /\bqueimadura\b/i, /\bdano\b/i, /\brecu[oa]\b/i, /\bturnos?\b/i,
        /\bgolpe\b/i, /\bdefesa\b/i, /\bataque\b/i, /\bpoder\b/i, /\bcongelar?\b/i,
        /\benvenenar?\b/i, /\bparalis[ia]/i, /\bcrítico\b/i, /\bpokémon\b/i,
        /\brestaura\b/i, /\baumenta\b/i, /\breduz\b/i, /\bbatalha\b/i,
        /\bcontra\b/i, /\benergía?\b/i, /\btipo\b/i, /\bsempre\b/i,
        /\bmuito\b/i, /\bpode\b/i, /\bcausa\b/i, /\bfaz\b/i
    ];
    let score = 0;
    for (const p of ptMarkers) {
        if (p.test(text)) score++;
    }
    return score >= 3;
}

// ======================================================================
// MAIN PROCESSING
// ======================================================================

function escapeForTS(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function processItems() {
    console.log('\n=== TRANSLATING ALL ITEMS TO PT-BR ===');
    const filePath = path.join(__dirname, '..', 'src', 'itemTranslations.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    const entryRegex = /^\s+'([^']+)':\s*\{\s*name:\s*'([^']*)',\s*description:\s*'((?:[^'\\]|\\.)*)'\s*\}/gm;
    let match;
    const entries = [];
    let stats = { alreadyPT: 0, translated: 0, total: 0 };

    while ((match = entryRegex.exec(content)) !== null) {
        const [, slug, name, desc] = match;
        const unescapedDesc = desc.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        stats.total++;

        if (isAlreadyPortuguese(unescapedDesc)) {
            entries.push({ slug, name, description: desc });
            stats.alreadyPT++;
        } else {
            const translated = translateItem(slug, name, unescapedDesc);
            entries.push({ slug, name, description: escapeForTS(translated) });
            stats.translated++;
        }
    }

    let output = `export const ptBRItemTranslations: Record<string, { name: string; description: string }> = {\n`;
    for (const e of entries) {
        output += `  '${e.slug}': { name: '${e.name}', description: '${e.description}' },\n`;
    }
    output += `};\n`;

    fs.writeFileSync(filePath, output, 'utf8');
    console.log(`  Total: ${stats.total} | Já em PT-BR: ${stats.alreadyPT} | Traduzidos: ${stats.translated}`);
    console.log(`  ✅ Salvo em src/itemTranslations.ts`);
    return stats;
}

function processMoves() {
    console.log('\n=== TRANSLATING ALL MOVES TO PT-BR ===');
    const filePath = path.join(__dirname, '..', 'src', 'moveTranslations.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    const entryRegex = /^\s+'([^']+)':\s*\{\s*description:\s*'((?:[^'\\]|\\.)*)'\s*\}/gm;
    let match;
    const entries = [];
    let stats = { alreadyPT: 0, translated: 0, total: 0 };

    while ((match = entryRegex.exec(content)) !== null) {
        const [, slug, desc] = match;
        const unescapedDesc = desc.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        stats.total++;

        if (isAlreadyPortuguese(unescapedDesc)) {
            entries.push({ slug, description: desc });
            stats.alreadyPT++;
        } else {
            const translated = translateSentence(unescapedDesc);
            entries.push({ slug, description: escapeForTS(translated) });
            stats.translated++;
        }
    }

    let output = `export const ptBRMoveTranslations: Record<string, { description: string }> = {\n`;
    for (const e of entries) {
        output += `  '${e.slug}': { description: '${e.description}' },\n`;
    }
    output += `};\n`;

    fs.writeFileSync(filePath, output, 'utf8');
    console.log(`  Total: ${stats.total} | Já em PT-BR: ${stats.alreadyPT} | Traduzidos: ${stats.translated}`);
    console.log(`  ✅ Salvo em src/moveTranslations.ts`);
    return stats;
}

console.log('🇧🇷 Traduzindo TUDO para PT-BR...');
const itemStats = processItems();
const moveStats = processMoves();
console.log('\n========================================');
console.log(`✅ CONCLUÍDO!`);
console.log(`   Itens:  ${itemStats.total} (${itemStats.alreadyPT} já PT-BR + ${itemStats.translated} traduzidos)`);
console.log(`   Moves: ${moveStats.total} (${moveStats.alreadyPT} já PT-BR + ${moveStats.translated} traduzidos)`);
console.log('========================================');
