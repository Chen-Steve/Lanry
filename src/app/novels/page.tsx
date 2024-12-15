import NovelListing from '@/app/novels/_components/NovelListing';
import NovelRequests from '@/app/novels/_components/NovelRequests';
import NovelTabs from '@/app/novels/_components/NovelTabs';

export const metadata = {
  title: 'Browse Novels | Lanry',
  description: 'Browse and read the latest translated light novels, or request new novels for translation on Lanry.',
};

export default function NovelsPage() {
  return (
    <main className="pb-2">
      <NovelTabs
        tabs={[
          {
            id: 'browse',
            label: 'Browse Novels',
            content: <NovelListing />
          },
          {
            id: 'requests',
            label: 'Novel Requests',
            content: <NovelRequests />
          }
        ]}
      />
    </main>
  );
} 