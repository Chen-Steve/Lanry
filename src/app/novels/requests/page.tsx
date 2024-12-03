import NovelRequests from '@/components/novels/NovelRequests';

export const metadata = {
  title: 'Requested Novels - Vote! | Lanry',
  description: 'Vote for novels you would like to see translated on Lanry. The most requested novels will be prioritized for translation.',
};

export default function NovelRequestsPage() {
  return (
    <main className="py-8">
      <NovelRequests />
    </main>
  );
} 