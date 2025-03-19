import NovelListing from '@/app/novels/_components/NovelListing';
import CookieSettingsButton from '@/app/_components/CookieSettingsButton';
import Script from 'next/script';

// Cache the page for 5 minutes
export const revalidate = 300;

export const metadata = {
  title: 'Browse Novels | Lanry',
  description: 'Browse and read the latest translated light novels on Lanry.',
};

export default function NovelsPage() {
  return (
    <main className="relative max-w-[1600px] mx-auto pb-2">
      {/* Left Ad Column */}
      <div className="hidden lg:block fixed left-[calc(50vw-750px)] top-24">
        <div id="pf-13998-1" className="w-[160px] h-[600px]">
          <Script
            id="pubfuture-ad"
            dangerouslySetInnerHTML={{
              __html: `window.pubfuturetag = window.pubfuturetag || [];
              window.pubfuturetag.push({unit: "67c7d9a804d811003cdb6267", id: "pf-13998-1"})`
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        <NovelListing />
      </div>
      
      <CookieSettingsButton />
    </main>
  );
} 