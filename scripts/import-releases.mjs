import mammoth from 'mammoth';
import { readdir, writeFile } from 'fs/promises';
import { join, basename } from 'path';
import crypto from 'crypto';

const DOCX_DIR = 'C:/Users/ggrimlan/Downloads/press releases';
const OUTPUT_FILE = 'C:/Users/ggrimlan/Downloads/press releases/newsroom/data/releases.json';

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Maps filename keywords → config. Each entry uses a unique keyword from the filename.
// Order matters for the match — more specific first if needed.
const FILENAME_CONFIG = [
  { key: 'ויצמן',           slug: 'intel-weizmann-llm',                   date: '2025-07-16T18:00:00.000Z' },
  { key: 'Mount Morgan',    slug: 'intel-mount-morgan',                    date: '2025-08-27T09:00:00.000Z' },
  { key: 'NVIDIA',          slug: 'intel-nvidia-cooperation',              date: '2025-03-01T09:00:00.000Z' },
  { key: 'GenAI',           slug: 'intel-genai-robots-medical',            date: '2026-03-09T18:30:00.000Z' },
  { key: 'Xeon',            slug: 'intel-xeon-workstation',                date: '2026-02-03T09:00:00.000Z' },
  { key: 'Core Ultra Series 3', slug: 'intel-core-ultra-series-3-ces-2026', date: '2026-01-06T01:00:00.000Z' },
  { key: 'SambaNova',       slug: 'intel-sambanova-investment',            date: '2025-02-01T09:00:00.000Z' },
  { key: 'OpenClaw',        slug: 'intel-openclaw-agent',                  date: '2025-04-01T09:00:00.000Z' },
  { key: 'אמזון',           slug: 'intel-amazon-aws-2025',                 date: '2025-08-20T18:00:00.000Z' },
  { key: 'דור 5',           slug: 'intel-ai-5g-networks',                  date: '2026-02-24T09:00:00.000Z' },
  { key: 'גשרים',           slug: 'intel-jerusalem-social-bridges',        date: '2025-06-01T09:00:00.000Z' },
  { key: 'AI Playground',   slug: 'intel-ai-playground-3',                 date: '2025-12-01T09:00:00.000Z' },
  { key: 'יום נגישות',     slug: 'intel-accessibility-day-kiryat-gat',    date: '2025-12-04T09:00:00.000Z' },
  { key: 'חנכה',            slug: 'intel-high-na-chip-machine',            date: '2025-10-01T09:00:00.000Z' },
  { key: 'סטנלי מורגן',    slug: 'intel-cpu-stanley-morgan-2026',         date: '2026-03-05T09:00:00.000Z' },
  { key: 'ווי-פיי',         slug: 'intel-wifi-8',                          date: '2025-11-20T09:00:00.000Z' },
  { key: 'הנתינה',          slug: 'intel-giving-day-2025',                 date: '2025-11-18T09:00:00.000Z' },
  { key: 'GPU',             slug: 'intel-gpu-announcement',                date: '2026-02-04T09:00:00.000Z' },
  { key: 'פורים',           slug: 'intel-haifa-volunteers-purim',          date: '2025-03-10T09:00:00.000Z' },
  { key: 'יד מרדכי',       slug: 'intel-volunteers-yad-mordechai',        date: '2025-05-01T09:00:00.000Z' },
];

function getFileConfig(filename) {
  for (const entry of FILENAME_CONFIG) {
    if (filename.includes(entry.key)) {
      return entry;
    }
  }
  return null;
}

function extractTitle(html) {
  // Parse paragraphs and headings, skip boilerplate lines
  const tagMatches = [...html.matchAll(/<(?:h[1-6]|p)[^>]*>(.*?)<\/(?:h[1-6]|p)>/gs)];

  const skipPatterns = [
    /^אמברגו/,
    /^באמברגו/,
    /^🚨/,
    /^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/,
    /^לפרסום מיידי/,
    /^הודעה לעיתונות$/,
  ];

  for (const match of tagMatches) {
    const text = stripHtml(match[1]).trim();
    if (text.length < 5) continue;
    if (skipPatterns.some(p => p.test(text))) continue;
    return text;
  }

  // Fallback: first non-empty, non-boilerplate paragraph text from html
  const plainLines = html.replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(l => l.length > 5);
  for (const line of plainLines) {
    if (skipPatterns.some(p => p.test(line))) continue;
    return line;
  }

  return 'ללא כותרת';
}

async function processDocx(filePath, index) {
  const result = await mammoth.convertToHtml({ path: filePath });
  const html = result.value;
  const plain = stripHtml(html);

  const filename = basename(filePath, '.docx');
  const config = getFileConfig(filename);

  const title = extractTitle(html);
  const publishedAt = config ? config.date : '2025-01-01T09:00:00.000Z';
  const slug = config ? config.slug : `press-release-${String(index + 1).padStart(2, '0')}`;
  const excerpt = plain.substring(0, 200).trim() || null;

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    slug,
    content: html,
    excerpt,
    published_at: publishedAt,
    created_at: now,
    updated_at: now,
    is_published: true,
    media_assets: []
  };
}

async function main() {
  const files = await readdir(DOCX_DIR);
  const docxFiles = files.filter(f => f.endsWith('.docx'));

  console.log(`Found ${docxFiles.length} .docx files`);

  const releases = [];
  const usedSlugs = new Set();

  for (let i = 0; i < docxFiles.length; i++) {
    const filePath = join(DOCX_DIR, docxFiles[i]);
    try {
      console.log(`\nProcessing (${i + 1}/${docxFiles.length}): ${docxFiles[i]}`);
      const release = await processDocx(filePath, i);

      // Ensure slug uniqueness
      let slug = release.slug;
      if (usedSlugs.has(slug)) {
        let counter = 2;
        while (usedSlugs.has(`${slug}-${counter}`)) counter++;
        slug = `${slug}-${counter}`;
        release.slug = slug;
        console.log(`  WARNING: Duplicate slug resolved to: ${slug}`);
      }
      usedSlugs.add(slug);

      console.log(`  Title: ${release.title.substring(0, 70)}`);
      console.log(`  Slug:  ${release.slug}`);
      console.log(`  Date:  ${release.published_at}`);
      releases.push(release);
    } catch (err) {
      console.error(`  ERROR processing ${docxFiles[i]}:`, err.message);
    }
  }

  // Sort by published_at descending
  releases.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  await writeFile(OUTPUT_FILE, JSON.stringify(releases, null, 2), 'utf-8');
  console.log(`\nWrote ${releases.length} releases to ${OUTPUT_FILE}`);

  // Print summary
  console.log('\n=== FINAL SUMMARY ===');
  releases.forEach((r, i) => {
    console.log(`${String(i + 1).padStart(2)}. [${r.published_at.substring(0, 10)}] ${r.slug}`);
    console.log(`    ${r.title.substring(0, 80)}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
