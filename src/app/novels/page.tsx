import NovelListing from '@/app/novels/_components/NovelListing';
import CookieSettingsButton from '@/app/_components/CookieSettingsButton';

// Cache the page for 5 minutes
export const revalidate = 300;

export const metadata = {
  title: 'Browse Novels | Lanry',
  description: 'Browse and read the latest translated light novels on Lanry.',
};

export default function NovelsPage() {
  return (
    <main className="relative max-w-[1600px] mx-auto pb-2">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        <NovelListing />
      </div>
      
      <CookieSettingsButton />
    </main>
  );
} 