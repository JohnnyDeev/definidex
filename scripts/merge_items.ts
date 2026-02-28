import fs from 'fs';
import path from 'path';

const SCRIPTS_DIR = 'd:/Evolith Studio/Sites/definidex/scripts';
const TARGET_FILE = 'd:/Evolith Studio/Sites/definidex/src/itemTranslations.ts';

async function mergeItemTranslations() {
    const allTranslations: Record<string, { name: string; description: string }> = {};

    // Read all batch files
    for (let i = 1; i <= 79; i++) {
        const filePath = path.join(SCRIPTS_DIR, `items_pt_${i}.json`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            try {
                const batch = JSON.parse(content);
                Object.assign(allTranslations, batch);
            } catch (e) {
                console.error(`Error parsing items_pt_${i}.json:`, e);
            }
        }
    }

    // Generate the TypeScript file with the correct export name for compatibility
    const tsContent = `export const ptBRItemTranslations: Record<string, { name: string; description: string }> = ${JSON.stringify(allTranslations, null, 2)};\n`;

    fs.writeFileSync(TARGET_FILE, tsContent);
    console.log(`Successfully generated ${TARGET_FILE}`);
    console.log(`Total items translated: ${Object.keys(allTranslations).length}`);
}

mergeItemTranslations();
