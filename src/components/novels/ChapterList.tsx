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
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid gap-2">
          {chapters.map((chapter) => (
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
    </div>
  );
}; 