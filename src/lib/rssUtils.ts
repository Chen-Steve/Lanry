import { Novel, Chapter } from '@prisma/client';

export function generateNovelFeedXML(novels: Novel[], baseUrl: string) {
  const now = new Date().toUTCString();
  
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lanry - Latest Novels</title>
    <link>${baseUrl}</link>
    <description>Latest novels on Lanry</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss/novels" rel="self" type="application/rss+xml" />
    ${novels.map(novel => `
    <item>
      <title>${escapeXml(novel.title)}</title>
      <link>${baseUrl}/novels/${novel.slug}</link>
      <guid>${baseUrl}/novels/${novel.slug}</guid>
      <description>${escapeXml(novel.description || '')}</description>
      <pubDate>${new Date(novel.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(novel.author)}</author>
    </item>`).join('')}
  </channel>
</rss>`;
}

export function generateChapterFeedXML(novel: Novel, chapters: Chapter[], baseUrl: string) {
  const now = new Date().toUTCString();
  
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lanry - ${escapeXml(novel.title)} Chapters</title>
    <link>${baseUrl}/novels/${novel.slug}</link>
    <description>Latest chapters for ${escapeXml(novel.title)} on Lanry</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss/novels/${novel.slug}/chapters" rel="self" type="application/rss+xml" />
    ${chapters.map(chapter => `
    <item>
      <title>Chapter ${chapter.chapterNumber}${chapter.title ? `: ${escapeXml(chapter.title)}` : ''}</title>
      <link>${baseUrl}/novels/${novel.slug}/c${chapter.chapterNumber}</link>
      <guid>${baseUrl}/novels/${novel.slug}/c${chapter.chapterNumber}</guid>
      <description>Chapter ${chapter.chapterNumber} of ${escapeXml(novel.title)}</description>
      <pubDate>${new Date(chapter.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(novel.author)}</author>
    </item>`).join('')}
  </channel>
</rss>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
} 