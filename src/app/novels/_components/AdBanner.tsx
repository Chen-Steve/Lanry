import Script from 'next/script';

interface AdBannerProps {
  position: 'left' | 'right';
}

export default function AdBanner({ position }: AdBannerProps) {
  return (
    <aside className="hidden lg:block w-[160px] min-h-screen sticky top-0">
      <div className="pt-4">
        <div id={`yllix-${position}-banner`} className="border-2 border-dashed border-gray-300 w-[160px] h-[600px]">
          <Script
            id={`yllix-ads-${position}`}
            src="https://udbaa.com/bnr.php?section=General&pub=275723&format=160x600&ga=g"
            type="text/javascript"
            strategy="lazyOnload"
          />
          <noscript>
            <a href="https://yllix.com/publishers/275723" target="_blank" rel="noopener noreferrer">
              <img 
                src="//ylx-aff.advertica-cdn.com/pub/160x600.png"
                style={{border: 'none', margin: 0, padding: 0, verticalAlign: 'baseline'}}
                alt="ylliX - Online Advertising Network"
              />
            </a>
          </noscript>
        </div>
      </div>
    </aside>
  );
} 