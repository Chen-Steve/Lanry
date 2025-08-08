import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabaseServer';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = await createServerClient();
  const { data: novel } = await supabase
    .from('novels')
    .select('title, description, slug')
    .eq('slug', params.id)
    .single();

  if (!novel) {
    return {
      title: 'Novel Not Found | Lanry',
      description: 'The requested novel could not be found.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lanry.space';

  return {
    title: `${novel.title} | Lanry`,
    description: novel.description || `Read ${novel.title} on Lanry`,
    alternates: {
      types: {
        'application/rss+xml': [
          {
            title: `${novel.title} - Latest Chapters RSS Feed`,
            url: `${baseUrl}/api/rss/novels/${novel.slug}/chapters`
          }
        ]
      }
    }
  };
} 