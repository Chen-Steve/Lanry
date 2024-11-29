import { Metadata } from 'next';
import ForumCategories from '@/components/forum/ForumCategories';
import CreateForumContent from '@/components/forum/CreateForumContent';
import { prisma } from '@/lib/prisma';
import type { CategoryBasicInfo } from '@/types/database';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Lanry | Forum',
  description: 'Join our community discussions about novels and more',
};

export default async function ForumPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  const categories: CategoryBasicInfo[] = await prisma.forumCategory.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      thread_count: true,
      latest_thread: true,
    },
  }).then(cats => cats.map(cat => ({
    ...cat,
    latest_thread: cat.latest_thread?.toISOString() || null
  })));

  // Get the user's role from the database
  let userRole = null;
  if (session?.user) {
    const dbUser = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    userRole = dbUser?.role;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-center">Forum Categories</h1>
        {session?.user && (
          <CreateForumContent 
            mode="thread" 
            categories={categories} 
            user={session.user}
            userRole={userRole}
          />
        )}
      </div>
      <ForumCategories categories={categories} />
    </main>
  );
}