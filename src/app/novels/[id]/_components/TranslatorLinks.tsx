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
    <div className="bg-[#F7F4ED] rounded-xl shadow-sm border-2 border-dashed border-black p-4 w-full sm:w-48 md:w-56">
      <h3 className="font-semibold text-gray-900 mb-3">Support Translator</h3>
      <div className="flex flex-col gap-2">
        {translator.kofiUrl && (
          <a
            href={translator.kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#13C3FF] hover:bg-[#00B9FF] transition-colors text-white font-medium"
          >
            <Icon icon="simple-icons:kofi" className="text-lg" />
            <span>Ko-fi</span>
          </a>
        )}
        {translator.patreonUrl && (
          <a
            href={translator.patreonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF424D] hover:bg-[#E23833] transition-colors text-white font-medium"
          >
            <Icon icon="simple-icons:patreon" className="text-lg" />
            <span>Patreon</span>
          </a>
        )}
        {translator.customUrl && (
          <a
            href={translator.customUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors text-white font-medium"
          >
            <Icon icon="mdi:link-variant" className="text-lg" />
            <span>{translator.customUrlLabel || 'Support'}</span>
          </a>
        )}
      </div>
    </div>
  );
}; 