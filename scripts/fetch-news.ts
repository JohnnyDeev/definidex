/**
 * fetch-news.ts — Automated Pokémon News Aggregator
 * 
 * Fetches RSS feeds from multiple Pokémon news sources,
 * categorizes articles (VGC, TCG, General), and saves
 * the result as a static JSON file for the frontend.
 * 
 * Usage: npx tsx scripts/fetch-news.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ─── Types ───────────────────────────────────────
interface NewsArticle {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    snippet: string;
    source: string;
    category: 'vgc' | 'tcg' | 'games-anime';
}

interface NewsData {
    lastUpdated: string;
    articles: NewsArticle[];
}

// ─── RSS Feed Sources ────────────────────────────
const RSS_FEEDS = [
    { url: 'https://www.pokebeach.com/category/tcg/feed', source: 'PokeBeach', category: 'tcg' },
    { url: 'https://pokeballer.com/feed', source: 'Pokéballer', category: 'tcg' },
    { url: 'https://victoryroadvgc.com/feed/', source: 'Victory Road', category: 'vgc' },
    { url: 'https://www.smogon.com/forums/forums/smogon-news.26/index.rss', source: 'Smogon News', category: 'vgc' },
    { url: 'https://pokemonblog.com/feed', source: 'Pokémon Blog', category: 'games-anime' },
    { url: 'https://www.nintendolife.com/feeds/latest', source: 'Nintendo Life', category: 'games-anime' },
];

/** Categorize article by keyword matching OR source category */
function categorize(title: string, description: string, feedCategory?: string): 'vgc' | 'tcg' | 'games-anime' {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Games & Anime Rules (Priority if explicitly games/anime keywords)
    if (text.includes('episode') || text.includes('trailer') || text.includes('leaks') || text.includes('anime')) {
        return 'games-anime';
    }

    // 2. TCG Rules
    if (text.includes('deck') || text.includes('booster') || text.includes('card') || text.includes('tcg') || text.includes('pokebeach')) {
        return 'tcg';
    }

    // 3. VGC Rules
    if (text.includes('vgc') || text.includes('doubles battle') || text.includes('victory road') || text.includes('competitive')) {
        return 'vgc';
    }

    // Fallback to feed category if available
    if (feedCategory === 'vgc') return 'vgc';
    if (feedCategory === 'tcg') return 'tcg';

    return 'games-anime';
}

// ─── Helpers ─────────────────────────────────────

/** Simple XML text extraction between tags */
function extractTag(xml: string, tag: string): string {
    // Try CDATA first
    const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 's');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    // Fallback: plain text
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

/** Extract all occurrences of an XML block */
function extractAllBlocks(xml: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'g');
    const blocks: string[] = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
        blocks.push(match[0]);
    }
    return blocks;
}

/** Decode HTML entities */
function decodeEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))))
        .replace(/&nbsp;/g, ' ');
}

/** Strip HTML tags and decode common entities (double-pass for entity-encoded HTML) */
function stripHtml(html: string): string {
    // First pass: decode entities then remove tags
    let result = decodeEntities(html);
    result = result.replace(/<[^>]*>/g, '');
    // Second pass: handle double-encoded entities (e.g. &amp;amp;)
    result = decodeEntities(result);
    result = result.replace(/<[^>]*>/g, '');
    return result.replace(/\s+/g, ' ').trim();
}

/** Truncate text to a snippet */
function truncate(text: string, maxLen: number = 200): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

/** Generate a stable ID from URL */
function urlToId(url: string): string {
    return url
        .replace(/https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80);
}

// ─── Feed Fetcher ────────────────────────────────

async function fetchFeed(feedUrl: string, sourceName: string, feedCategory: string): Promise<NewsArticle[]> {
    console.log(`  📡 Fetching: ${feedUrl} (${feedCategory})`);

    try {
        const res = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'DefiniDEX-NewsBot/1.0 (+https://definidex.netlify.app)',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            console.warn(`  ⚠️  HTTP ${res.status} from ${feedUrl}`);
            return [];
        }

        const xml = await res.text();
        const items = extractAllBlocks(xml, 'item');
        console.log(`  ✅ Found ${items.length} articles from ${sourceName}`);

        return items.map(item => {
            const title = stripHtml(extractTag(item, 'title'));
            const link = stripHtml(extractTag(item, 'link'));
            const pubDate = extractTag(item, 'pubDate');
            const rawDesc = extractTag(item, 'description');
            const snippet = truncate(stripHtml(rawDesc));

            return {
                id: urlToId(link),
                title,
                link,
                pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                snippet,
                source: sourceName,
                category: categorize(title, rawDesc, feedCategory),
            };
        });
    } catch (err) {
        console.error(`  ❌ Failed to fetch ${feedUrl}:`, err instanceof Error ? err.message : err);
        return [];
    }
}

// ─── Main ────────────────────────────────────────

async function main() {
    console.log('🔄 DefiniDEX News Fetcher\n');

    // Fetch all feeds in parallel
    const results = await Promise.all(
        RSS_FEEDS.map(feed => fetchFeed(feed.url, feed.source, feed.category))
    );

    // Flatten and deduplicate by link
    const seen = new Set<string>();
    const allArticles: NewsArticle[] = [];

    for (const articles of results) {
        for (const article of articles) {
            if (!seen.has(article.link) && article.title) {
                seen.add(article.link);
                allArticles.push(article);
            }
        }
    }

    // Sort by date descending
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Limit to 50 most recent
    const finalArticles = allArticles.slice(0, 50);

    const data: NewsData = {
        lastUpdated: new Date().toISOString(),
        articles: finalArticles,
    };

    // Write to public/data/news.json
    const outputDir = join(process.cwd(), 'public', 'data');
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, 'news.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

    // Stats
    const vgcCount = finalArticles.filter(a => a.category === 'vgc').length;
    const tcgCount = finalArticles.filter(a => a.category === 'tcg').length;
    const generalCount = finalArticles.filter(a => a.category === 'games-anime').length;

    console.log(`\n📊 Results:`);
    console.log(`   Total: ${finalArticles.length} articles`);
    console.log(`   VGC: ${vgcCount} | TCG: ${tcgCount} | Apps/Anime: ${generalCount}`);
    console.log(`   Saved to: ${outputPath}`);
    console.log('✅ Done!');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
