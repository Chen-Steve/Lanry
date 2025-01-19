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

export function generateChapterFeedXML(novel: Novel | null, chapters: (Chapter & { novel: Novel })[], baseUrl: string) {
  const now = new Date().toUTCString();
  const title = novel ? `${escapeXml(novel.title)} Chapters` : 'All Latest Chapters';
  const link = novel ? `${baseUrl}/novels/${novel.slug}` : baseUrl;
  const description = novel ? `Latest chapters for ${escapeXml(novel.title)} on Lanry` : 'Latest chapters from all novels on Lanry';
  const feedUrl = novel ? `novels/${novel.slug}/chapters` : 'freechapters';
  
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lanry - ${title}</title>
    <link>${link}</link>
    <description>${description}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss/${feedUrl}" rel="self" type="application/rss+xml" />
    ${chapters.map(chapter => `
    <item>
      <title>${novel ? '' : `[${escapeXml(chapter.novel.title)}] `}Chapter ${chapter.chapterNumber}${chapter.title ? `: ${escapeXml(chapter.title)}` : ''}</title>
      <link>${baseUrl}/novels/${novel ? novel.slug : chapter.novel.slug}/c${chapter.chapterNumber}</link>
      <guid>${baseUrl}/novels/${novel ? novel.slug : chapter.novel.slug}/c${chapter.chapterNumber}</guid>
      <description><![CDATA[
        <div style="font-family: Arial, sans-serif; padding: 15px;">
          <h3>${novel ? `Chapter ${chapter.chapterNumber}` : `Chapter ${chapter.chapterNumber} of ${escapeXml(chapter.novel.title)}`}</h3>
          <a href="${baseUrl}/novels/${novel ? novel.slug : chapter.novel.slug}/c${chapter.chapterNumber}" 
             style="display: inline-block; 
                    background-color: #4a5568; 
                    color: white; 
                    padding: 10px 20px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    margin-top: 10px;">
            Read Chapter
          </a>
        </div>
      ]]></description>
      <pubDate>${new Date(chapter.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(novel ? novel.author : chapter.novel.author)}</author>
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