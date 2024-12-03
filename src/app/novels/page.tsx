import NovelListing from '@/components/NovelListing';

export const metadata = {
  title: 'Browse Novels | Lanry',
  description: 'Browse and read the latest translated light novels on Lanry.',
};

export default function NovelsPage() {
  return (
    <main>
      <NovelListing />
    </main>
  );
} 