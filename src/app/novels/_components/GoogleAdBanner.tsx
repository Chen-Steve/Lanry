import Script from 'next/script';

export default function GoogleAdBanner() {
  return (
    <aside className="hidden lg:block w-[160px] min-h-screen sticky top-0">
      <div className="pt-4">
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-1969691044413795"
          data-ad-slot="your-ad-slot-id"
          data-ad-format="vertical"
          data-full-width-responsive="false"
        />
        <Script id="adsense-init">
          {`
            (adsbygoogle = window.adsbygoogle || []).push({});
          `}
        </Script>
      </div>
    </aside>
  );
} 