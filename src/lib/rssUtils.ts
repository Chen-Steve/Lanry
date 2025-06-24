import { Novel, Chapter } from '@prisma/client';
/* eslint-disable @typescript-eslint/no-explicit-any */

// Prefer translator name if provided, otherwise fallback to original author.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAuthorName(novel: any): string {
  if (typeof novel === 'object' && novel) {
    if (novel.translatorUsername) return novel.translatorUsername;
    if (novel.isAuthorNameCustom && novel.authorProfileUsername) return novel.authorProfileUsername;
    return novel.author ?? '';
  }
  return '';
}

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
      <author>${escapeXml(getAuthorName(novel))}</author>
      ${novel.coverImageUrl ? `<enclosure url="${escapeXml(novel.coverImageUrl)}" type="image/jpeg" />` : ''}
    </item>`).join('')}
  </channel>
</rss>`;
}

export function generateChapterFeedXML(novel: Novel | null, chapters: (Chapter & { novel: Novel })[], baseUrl: string) {
  const now = new Date().toUTCString();
  const title = novel ? `${escapeXml(novel.title)} Chapters` : 'All Latest Chapters';
  const link = novel ? `${baseUrl}/novels/${novel.slug}` : baseUrl;
  const description = novel ? `Latest chapters for ${escapeXml(novel.title)} on Lanry` : 'Latest chapters from all novels on Lanry';
  const feedUrl = novel ? `novels/${novel.slug}/chapters` : 'novelupdates';
  
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
      ${(() => {
        const chapterSlug = chapter.slug ?? `c${chapter.chapterNumber}`;
        const chapterBase = `${baseUrl}/novels/${novel ? novel.slug : chapter.novel.slug}/${chapterSlug}`;
        return `\n      <link>${chapterBase}</link>\n      <guid>${chapterBase}</guid>`;
      })()}
      <description><![CDATA[
        <div>
          <p><strong>${novel ? `Chapter ${chapter.chapterNumber}` : `Chapter ${chapter.chapterNumber} of ${escapeXml(chapter.novel.title)}`}</strong></p>
          <p>Read it on Lanry: <a href="${baseUrl}/novels/${novel ? novel.slug : chapter.novel.slug}/${chapter.slug ?? `c${chapter.chapterNumber}`}">Open Chapter</a></p>
        </div>
      ]]></description>
      <pubDate>${new Date((chapter as any).publishAt ?? chapter.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(novel ? getAuthorName(novel) : getAuthorName(chapter.novel))}</author>
      ${(() => {
        const cover = novel ? novel.coverImageUrl : chapter.novel.coverImageUrl;
        return cover ? `<enclosure url="${escapeXml(cover)}" type="image/jpeg" />` : '';
      })()}
      <novelTitle>${escapeXml(novel ? novel.title : chapter.novel.title)}</novelTitle>
      <chapterTitle>${`Chapter ${chapter.chapterNumber}${chapter.title ? `: ${escapeXml(chapter.title)}` : ''}`}</chapterTitle>
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