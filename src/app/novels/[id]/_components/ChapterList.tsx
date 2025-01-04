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
    <div className="max-w-5xl mx-auto">
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="max-w-full overflow-hidden">
              <ChapterListItem
                chapter={{
                  ...chapter,
                  novel_id: novelId
                }}
                novelSlug={novelSlug}
                userProfile={userProfile}
                isAuthenticated={isAuthenticated}
                novelAuthorId={novelAuthorId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 