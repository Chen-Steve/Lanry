import { Icon } from '@iconify/react';

interface TranslatorLinksProps {
  translator: {
    username: string | null;
    profile_id: string;
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
  };
}

export const TranslatorLinks = ({ translator }: TranslatorLinksProps) => {
  if (!translator.kofiUrl && !translator.patreonUrl && !translator.customUrl) return null;
  
  return (
    <div className="flex gap-3">
      <div className="flex flex-wrap gap-2">
        {translator.kofiUrl && (
          <a
            href={translator.kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-[#13C3FF]/10 hover:bg-[#13C3FF]/20 text-[#13C3FF] font-medium transition-colors"
          >
            <Icon icon="simple-icons:kofi" className="text-base" />
            <span>Ko-fi</span>
          </a>
        )}
        {translator.patreonUrl && (
          <a
            href={translator.patreonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-[#FF424D]/10 hover:bg-[#FF424D]/20 text-[#FF424D] font-medium transition-colors"
          >
            <Icon icon="simple-icons:patreon" className="text-base" />
            <span>Patreon</span>
          </a>
        )}
        {translator.customUrl && (
          <a
            href={translator.customUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            <Icon icon="mdi:link-variant" className="text-base" />
            <span>{translator.customUrlLabel || 'Support'}</span>
          </a>
        )}
      </div>
    </div>
  );
}; 