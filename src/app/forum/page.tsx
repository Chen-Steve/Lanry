import { Metadata } from 'next';
import ForumCategories from '@/components/forum/ForumCategories';
import CreatePostButton from '@/components/forum/CreatePostButton';
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
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Forum Categories</h1>
        <CreatePostButton mode="thread" categories={categories} />
      </div>
      <ForumCategories />
    </main>
  );
}