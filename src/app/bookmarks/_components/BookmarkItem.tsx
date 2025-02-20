import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { memo, useState, useRef, useEffect } from 'react';

interface Novel {
  id: string;
  title: string;
  author?: string;
  slug: string | null;
  cover_image_url: string;
}

interface Bookmark {
  id: string;
  profileId: string;
  novelId: string;
  createdAt: string;
  novel: Novel;
}

interface BookmarkFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  isOwnProfile: boolean;
  isFirstPage: boolean;
  index: number;
  folders?: BookmarkFolder[];
  onMoveToFolder?: (bookmarkId: string, folderId: string | null) => void;
  columnIndex?: number;
}

const BookmarkItem = memo(({ 
  bookmark, 
  isOwnProfile, 
  isFirstPage,
  index,
  folders = [],
  onMoveToFolder,
  columnIndex = 0
}: BookmarkItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isPriority = isFirstPage && index < 4;
  const shouldAlignRight = columnIndex >= 2;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <div className="relative group">
      <Link 
        href={`/novels/${bookmark.novel.slug}`}
        className="block"
        onClick={(e) => {
          if (isMenuOpen) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-md bg-accent/5">
          <Image
            src={bookmark.novel.cover_image_url 
              ? (bookmark.novel.cover_image_url.startsWith('http') 
                  ? bookmark.novel.cover_image_url 
                  : `/novel-covers/${bookmark.novel.cover_image_url}`)
              : '/images/default-cover.jpg'}
            alt={bookmark.novel.title}
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 768px) 16.67vw, (max-width: 1024px) 12.5vw, 8.33vw"
            loading={isPriority ? "eager" : "lazy"}
            priority={isPriority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="mt-1.5 px-0.5">
          <h3 className="text-sm font-medium truncate relative z-10 text-foreground">{bookmark.novel.title}</h3>
        </div>
      </Link>

      {isMenuOpen && isOwnProfile && onMoveToFolder && (
        <div 
          ref={menuRef}
          className={`absolute z-[100] w-44 py-1 bg-background rounded-md shadow-lg border ${
            shouldAlignRight ? 'right-1' : 'left-1'
          }`}
          style={{
            top: buttonRef.current?.offsetHeight ? buttonRef.current.offsetHeight + 8 : 32
          }}
        >
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
            Move to folder
          </div>
          <button
            onClick={() => {
              onMoveToFolder(bookmark.id, null);
              setIsMenuOpen(false);
            }}
            className="w-full px-2 py-1 text-xs text-left hover:bg-accent/50 flex items-center gap-2"
          >
            <Icon icon="mdi:bookmark-multiple" className="w-3.5 h-3.5" />
            <span>Default</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                onMoveToFolder(bookmark.id, folder.id);
                setIsMenuOpen(false);
              }}
              className="w-full px-2 py-1 text-xs text-left hover:bg-accent/50 flex items-center gap-2"
            >
              <Icon 
                icon={folder.icon || 'mdi:folder'} 
                className="w-3.5 h-3.5"
                style={{ color: folder.color || 'currentColor' }}
              />
              <span>{folder.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
BookmarkItem.displayName = 'BookmarkItem';

export default BookmarkItem; 