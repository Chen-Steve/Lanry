import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

async function getNovel(id: string): Promise<Novel | null> {
  try {
    const novel = await prisma.novel.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        coverImageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        chapters: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });

    if (!novel) return null;

    return {
      ...novel,
      coverImage: novel.coverImageUrl ?? undefined,
      bookmarks: 0,
      chapters: novel.chapters,
    };
  } catch (error) {
    console.error('Error fetching novel:', error);
    throw new Error('Failed to fetch novel');
  }
}

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0;
}

export default async function NovelPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  if (!isValidId(id)) {
    notFound();
  }

  const novel = await getNovel(id);

  if (!novel) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Cover Image */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="sticky top-8">
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
              {novel.coverImage ? (
                <Image
                  src={novel.coverImage}
                  alt={novel.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Novel Information */}
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
              <p className="text-lg text-gray-600">by {novel.author}</p>
            </div>
            
            {/* Moved buttons to top right */}
            <div className="flex gap-2">
              <button aria-label="Bookmark" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                <Icon icon="mdi:bookmark-outline" className="text-xl" />
              </button>
              
              <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
                <Icon icon="mdi:book-open-page-variant" className="text-xl" />
                <span>Start Reading</span>
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Icon icon="mdi:bookmark" />
              <span>{novel.bookmarks.toLocaleString()} Bookmarks</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="mdi:book" />
              <span>{novel.chapters.length} Chapters</span>
            </div>
          </div>

          {/* Synopsis */}
          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-2">Synopsis</h2>
            <p className="text-gray-700 whitespace-pre-line">{novel.description}</p>
          </div>

          {/* Latest Chapters */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Latest Chapters</h2>
            <div className="space-y-2">
              {novel.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">{chapter.title}</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(chapter.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{novel.status}</span>
            </div>
            <div>
              <span className="text-gray-600">Released:</span>
              <span className="ml-2 font-medium">
                {formatDate(novel.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>
              <span className="ml-2 font-medium">
                {formatDate(novel.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 