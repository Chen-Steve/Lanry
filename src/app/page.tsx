import NovelListing from '@/components/NovelListing';
import AdSection from '@/components/AdSection';

export default function Home() {
  return (
    <div className="flex flex-col sm:flex-row max-w-5xl mx-auto">
      <div className="flex-grow">

        <NovelListing />
      </div>
      <div className="w-full sm:w-64 sm:flex-shrink-0">
        <AdSection />
      </div>
    </div>
  );
}
