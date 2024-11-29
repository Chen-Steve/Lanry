import { Metadata } from 'next';
import ThreadList from '@/components/forum/ThreadList';
import CreateThreadButton from '@/components/forum/CreateThreadButton';

export const metadata: Metadata = {
  title: 'Forum Category | Novel Reading Platform',
  description: 'View threads in this category',
};

export default function CategoryPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Threads</h1>
        <CreateThreadButton categoryId={params.id} />
      </div>
      <ThreadList categoryId={params.id} />
    </main>
  );
} 