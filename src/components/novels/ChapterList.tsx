import { Chapter, UserProfile } from '@/types/database';
import { ChapterListItem } from './ChapterListItem';

interface ChapterListProps {
  chapters: Chapter[];
  novelId: string;
  novelSlug: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  novelAuthorId: string;
}

export const ChapterList = ({
  chapters,
  novelId,
  novelSlug,
  userProfile,
  isAuthenticated,
  novelAuthorId
}: ChapterListProps) => {
  return (
    <div className="mt-12 relative">
      {/* Quick Jump Navigation - Fixed on desktop, horizontal scroll on mobile */}
      <div className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-0 mb-4 md:mb-0 gap-2 md:gap-2 
                      md:fixed md:right-4 md:top-1/2 md:-translate-y-1/2">
        {Array.from({ length: Math.ceil(chapters.length / 150) }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const element = document.getElementById(`chapter-section-${index}`);
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 
                       flex items-center justify-center text-sm text-black"
            title={`Chapters ${index * 150 + 1}-${Math.min((index + 1) * 150, chapters.length)}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Chapter sections */}
      {Array.from({ length: Math.ceil(chapters.length / 150) }).map((_, sectionIndex) => {
        const sectionChapters = chapters.slice(
          sectionIndex * 150,
          (sectionIndex + 1) * 150
        );

        return (
          <div
            key={sectionIndex}
            id={`chapter-section-${sectionIndex}`}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold mb-4 text-black">
              Chapters {sectionIndex * 150 + 1}-
              {Math.min((sectionIndex + 1) * 150, chapters.length)}
            </h3>
            <div className="grid gap-2">
              {sectionChapters.map((chapter) => (
                <ChapterListItem
                  key={chapter.id}
                  chapter={{
                    ...chapter,
                    novel_id: novelId
                  }}
                  novelSlug={novelSlug}
                  userProfile={userProfile}
                  isAuthenticated={isAuthenticated}
                  novelAuthorId={novelAuthorId}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 