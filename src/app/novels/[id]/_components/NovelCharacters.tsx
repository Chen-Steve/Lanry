import Image from 'next/image';

interface NovelCharacter {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  description?: string | null;
  orderIndex: number;
}

interface NovelCharactersProps {
  characters: NovelCharacter[];
}

export const NovelCharacters = ({ characters }: NovelCharactersProps) => {
  if (characters.length === 0) {
    return null;
  }

  return (
    <div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {characters.map((character) => (
          <div
            key={character.id}
            className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-[3/4] relative">
              <Image
                src={character.imageUrl}
                alt={character.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            </div>
            <div className="p-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {character.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {character.role}
              </p>
              {character.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                  {character.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 