/**
 * sanitization.ts — Profanity Filter for Pokémon Community Content
 * 
 * Supports PT-BR, EN, and ES common profanities.
 * replaces letters with ******* while keeping the environment friendly.
 */

const PROFANITY_LIST = [
    // Portuguese
    'porra', 'caralho', 'fodas', 'foda-se', 'merda', 'puta', 'vagabundo', 'viado', 'cu', 'arrombado',
    // English
    'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'faggot', 'bastard', 'crap',
    // Spanish
    'mierda', 'puta', 'cabron', 'joder', 'pendejo', 'chinga', 'maricon', 'gilipollas', 'carajo', 'verga'
];

/**
 * Sanitizes a string by replacing profanities with asterisks.
 */
export function sanitizeContent(text: string): string {
    if (!text) return '';

    let sanitized = text;

    PROFANITY_LIST.forEach(word => {
        // Simple word boundary check to avoid censoring words like "assist" or "escudo"
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        sanitized = sanitized.replace(regex, (match) => '*'.repeat(match.length));
    });

    return sanitized;
}
