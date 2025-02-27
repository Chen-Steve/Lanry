import { Icon } from '@iconify/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTranslators, Translator } from '@/services/translatorService';

const TranslatorProfiles = () => {
  const [translators, setTranslators] = useState<Translator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranslators = async () => {
      try {
        const data = await getTranslators();
        setTranslators(data);
      } catch (error) {
        console.error('Error fetching translators:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslators();
  }, []);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-3 px-4">
          <h2 className="text-lg font-semibold text-center underline decoration-dashed underline-[3px] underline-offset-4">Active Translators</h2>
          <Link 
            href="/translators"
            className="text-sm text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1"
          >
            View all
            <Icon icon="mdi:arrow-right" className="w-4 h-4" />
          </Link>
        </div>

        <div className="px-4">
          <div className="flex gap-0 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-none w-[120px] flex flex-col items-center p-3 bg-card rounded-md">
                <div className="w-16 h-16 mb-3 rounded-full bg-accent animate-pulse" />
                <div className="w-20 h-4 bg-accent animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (translators.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-2 mb-3 px-4">
        <h2 className="text-lg font-semibold text-center underline decoration-dashed underline-[3px] underline-offset-4">Active Translators</h2>
        <Link 
          href="/translators"
          className="text-sm text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1"
        >
          View all
          <Icon icon="mdi:arrow-right" className="w-4 h-4" />
        </Link>
      </div>

      <div className="px-4">
        <div className="flex gap-0 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary">
          {translators.map((translator) => (
            <Link
              key={translator.id}
              href={`/user-dashboard?id=${translator.id}`}
              className="group flex-none w-[120px] flex flex-col items-center p-3 bg-card hover:bg-accent/50 rounded-md transition-colors"
            >
              <div className="relative w-16 h-16 mb-3">
                {translator.avatarUrl ? (
                  <Image
                    src={translator.avatarUrl}
                    alt={translator.username}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-accent flex items-center justify-center">
                    <Icon icon="mdi:account" className="text-3xl text-muted-foreground" />
                  </div>
                )}
              </div>

              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors text-center truncate w-full">
                {translator.username}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TranslatorProfiles; 