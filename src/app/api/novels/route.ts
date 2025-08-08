import { NextResponse } from 'next/server';
import { generateNovelSlug } from '@/lib/utils';
import { createServerClient } from '@/lib/supabaseServer';

// Mark this route as dynamic so it is never cached at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Valid statuses we accept from the client
const VALID_STATUSES = ['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'DRAFT'] as const;
type NovelStatus = typeof VALID_STATUSES[number];

interface CreateNovelPayload {
  title: string;
  author: string;
  description: string;
  status: NovelStatus | string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    // Obtain current session (may be null for anonymous)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const body = (await request.json()) as Partial<CreateNovelPayload>;
    const { title, author, description, status } = body;

    // Basic validation
    if (!title || !author || !description || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status.toUpperCase() as NovelStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 422 });
    }

    const slug = generateNovelSlug(title);

    // Assemble row to insert
    const novelData: Record<string, unknown> = {
      title,
      author,
      description,
      status: status.toUpperCase(),
      slug,
    };

    // If a user is signed in, associate the profile as author
    if (session?.user) {
      novelData.author_profile_id = session.user.id;
    }

    // Insert and return the created row
    const { data, error } = await supabase
      .from('novels')
      .insert([novelData])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error creating novel:', error);
      return NextResponse.json({ error: 'Database operation failed' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating novel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Fetch novels and their latest chapter (if any)
    const { data: novels, error } = await supabase
      .from('novels')
      .select(
        `*,
        chapters:chapters (
          id,
          created_at
        )`
      )
      .neq('status', 'DRAFT');

    if (error) {
      console.error('Supabase error fetching novels:', error);
      return NextResponse.json({ error: 'Error fetching novels' }, { status: 500 });
    }

    if (!novels) return NextResponse.json([]);

    // Sort by latest chapter date (fallback to novel creation date) without using `any`
    interface NovelRow {
      created_at: string;
      chapters?: { created_at: string }[];
      // allow any additional properties but keep type-safe parts we need
      [key: string]: unknown;
    }

    const sorted = (novels as NovelRow[]).sort((a, b) => {
      const aLatestDate = a.chapters?.[0]?.created_at ?? a.created_at;
      const bLatestDate = b.chapters?.[0]?.created_at ?? b.created_at;

      return new Date(bLatestDate).getTime() - new Date(aLatestDate).getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error fetching novels:', error);
    return NextResponse.json({ error: 'Error fetching novels' }, { status: 500 });
  }
} 