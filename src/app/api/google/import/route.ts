import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/googleDrive';
import { createServerClient } from '@supabase/ssr';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import supabaseAdmin from '@/lib/supabaseAdmin';

// Initialize Turndown once
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

// Custom rule: underline <u> → __text__
td.addRule('underline', {
  filter: ['u'],
  replacement: (content) => `_${content}_`,
});

// Combined style rule to handle bold/italic/underline combos
td.addRule('span-style-combo', {
  filter: (node) => {
    const el = node as HTMLElement;
    if (el.nodeName !== 'SPAN') return false;
    const bold = !!el.style.fontWeight && parseInt(el.style.fontWeight as string) >= 600;
    const italic = el.style.fontStyle === 'italic' || el.style.fontStyle === 'oblique';
    const underline = !!el.style.textDecoration && el.style.textDecoration.includes('underline');
    return bold || italic || underline;
  },
  replacement: (content, node) => {
    const el = node as HTMLElement;
    const parts: string[] = [];
    const bold = !!el.style.fontWeight && parseInt(el.style.fontWeight as string) >= 600;
    const italic = el.style.fontStyle === 'italic' || el.style.fontStyle === 'oblique';
    const underline = !!el.style.textDecoration && el.style.textDecoration.includes('underline');

    if (bold) parts.push('**');
    if (italic) parts.push('*');
    if (underline) parts.push('_');

    const prefix = parts.join('');
    const suffix = parts.reverse().join('');
    return `${prefix}${content}${suffix}`;
  },
});

function htmlToMarkdown(html: string) {
  return td.turndown(html);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileIds, novelId } = body as { fileIds: string[]; novelId: string };

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'fileIds array required' }, { status: 400 });
    }
    if (!novelId) {
      return NextResponse.json({ error: 'novelId required' }, { status: 400 });
    }

    const res = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: res.headers });
    }

    const drive = await getDriveClient(user.id);

    const imported: string[] = [];
    const errors: { fileId: string; message: string }[] = [];

    for (const fileId of fileIds) {
      try {
        // Get file metadata to decide type
        const { data: meta } = await drive.files.get({ fileId, fields: 'id, name, mimeType' });
        const mime = meta.mimeType || '';
        const name = meta.name || 'Untitled';

        let htmlContent = '';

        if (mime === 'application/vnd.google-apps.document') {
          // Export as HTML
          const res = await drive.files.export({ fileId, mimeType: 'text/html' }, { responseType: 'arraybuffer' });
          htmlContent = Buffer.from(res.data as ArrayBuffer).toString('utf8');
        } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Download docx and convert using mammoth
          const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
          const result = await mammoth.convertToHtml({ buffer: Buffer.from(res.data as ArrayBuffer) });
          htmlContent = result.value;
        } else {
          throw new Error(`Unsupported mime type: ${mime}`);
        }

        const textContent = htmlToMarkdown(htmlContent);

        // Find next chapter number for the novel
        const { data: lastChapter, error: lcErr } = await supabaseAdmin
          .from('chapters')
          .select('chapter_number')
          .eq('novel_id', novelId)
          .order('chapter_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lcErr) throw lcErr;

        const nextNumber = (lastChapter?.chapter_number ?? 0) + 1;

        // Insert chapter
        const { error: insertErr } = await supabaseAdmin
          .from('chapters')
          .insert({
            id: crypto.randomUUID(),
            title: name,
            content: textContent,
            novel_id: novelId,
            chapter_number: nextNumber,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            slug: `chapter-${nextNumber}`,
          });

        if (insertErr) throw insertErr;

        imported.push(fileId);
      } catch (error) {
        errors.push({ fileId: fileId, message: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({ imported, errors }, { headers: res.headers });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import files' }, { status: 500 });
  }
}