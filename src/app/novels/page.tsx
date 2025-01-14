import NovelListing from '@/app/novels/_components/NovelListing';
import AdBanner from './_components/YllixAdBanner';
import GoogleAdBanner from './_components/GoogleAdBanner';

export const metadata = {
  title: 'Browse Novels | Lanry',
  description: 'Browse and read the latest translated light novels on Lanry.',
};

export default function NovelsPage() {
  return (
    <main className="relative max-w-[1600px] mx-auto pb-2">
      <div className="max-w-5xl mx-auto">
        <NovelListing />
      </div>
      <div className="absolute top-0 left-0">
        <AdBanner position="left" />
      </div>
      <div className="absolute top-0 right-0">
        <GoogleAdBanner />
      </div>
    </main>
  );
} 