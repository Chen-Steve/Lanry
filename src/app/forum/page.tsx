import { Metadata } from 'next';
import ForumCategories from '@/components/forum/ForumCategories';
import { prisma } from '@/lib/prisma';
import type { CategoryBasicInfo } from '@/types/database';

export const metadata: Metadata = {
  title: 'Lanry | Forum',
  description: 'Join our community discussions about novels and more',
};

export default async function ForumPage() {

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

  return (
    <main className="w-full">
      <div className="max-w-5xl mx-auto px-4 mt-4 sm:mt-8 mb-6 sm:mb-10">
        <h1 className="text-3xl font-bold text-center mb-6">Forum Categories</h1>
        <ForumCategories categories={categories} />
      </div>
    </main>
  );
}