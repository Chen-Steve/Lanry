import { Icon } from '@iconify/react';
import Image from 'next/image';
import Link from 'next/link';

interface Translator {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface TranslatorProfilesProps {
  translators: Translator[];
}

const TranslatorProfiles = ({ translators }: TranslatorProfilesProps) => {
  if (translators.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-4">
        <h2 className="text-lg font-semibold text-center w-full underline decoration-dashed underline-[3px] underline-offset-4">Active Translators</h2>
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