import { Metadata } from 'next';
import ThreadDetail from '@/components/forum/ThreadDetail';

export const metadata: Metadata = {
  title: 'Thread | Novel Reading Platform',
  description: 'View and participate in forum discussions',
};

export default function ThreadPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <ThreadDetail threadId={params.id} />
    </main>
  );
} 