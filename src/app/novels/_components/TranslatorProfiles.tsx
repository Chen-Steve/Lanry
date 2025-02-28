import { Icon } from '@iconify/react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Translator } from '@/services/translatorService';

// Define border styles with glow effects
const borderStyles = {
  emerald: 'border-2 border-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)] hover:shadow-[0_0_15px_theme(colors.emerald.400)]',
  violet: 'border-2 border-violet-400 shadow-[0_0_10px_theme(colors.violet.400)] hover:shadow-[0_0_15px_theme(colors.violet.400)]',
  rose: 'border-2 border-rose-400 shadow-[0_0_10px_theme(colors.rose.400)] hover:shadow-[0_0_15px_theme(colors.rose.400)]',
  amber: 'border-2 border-amber-400 shadow-[0_0_10px_theme(colors.amber.400)] hover:shadow-[0_0_15px_theme(colors.amber.400)]',
  cyan: 'border-2 border-cyan-400 shadow-[0_0_10px_theme(colors.cyan.400)] hover:shadow-[0_0_15px_theme(colors.cyan.400)]',
  fuchsia: 'border-2 border-fuchsia-400 shadow-[0_0_10px_theme(colors.fuchsia.400)] hover:shadow-[0_0_15px_theme(colors.fuchsia.400)]',
  lime: 'border-2 border-lime-400 shadow-[0_0_10px_theme(colors.lime.400)] hover:shadow-[0_0_15px_theme(colors.lime.400)]'
} as const;

interface TranslatorProfilesProps {
  translators: Translator[];
}

const TranslatorProfiles = ({ translators }: TranslatorProfilesProps) => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // Assign random border styles to translators
  const translatorBorders = useMemo(() => {
    const styles = Object.keys(borderStyles) as (keyof typeof borderStyles)[];
    return translators.map(() => styles[Math.floor(Math.random() * styles.length)]);
  }, [translators]);

  if (translators.length === 0) return null;

  const handleImageError = (translatorId: string) => {
    setFailedImages(prev => new Set(prev).add(translatorId));
  };

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
          {translators.map((translator, index) => (
            <Link
              key={translator.id}
              href={`/user-dashboard?id=${translator.id}`}
              className="group flex-none w-[130px] flex flex-col items-center p-2 bg-card hover:bg-accent/50 rounded-md transition-colors"
            >
              <div className={`relative w-24 h-24 mb-3 overflow-hidden rounded-xl bg-accent transition-all duration-300 group-hover:scale-110 ${borderStyles[translatorBorders[index]]}`}>
                {failedImages.has(translator.id) && !translator.avatarUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon 
                      icon="mingcute:user-4-fill" 
                      className="w-12 h-12 text-muted-foreground/50" 
                    />
                  </div>
                ) : (
                  <Image
                    src={translator.avatarUrl || '/lanry.jpg'}
                    alt={translator.username}
                    fill
                    sizes="(max-width: 96px) 100vw, 96px"
                    priority={index < 4}
                    unoptimized={!translator.avatarUrl || translator.avatarUrl === '/lanry.jpg'}
                    className="object-cover"
                    onError={() => {
                      if (!translator.avatarUrl) {
                        handleImageError(translator.id);
                      }
                    }}
                  />
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