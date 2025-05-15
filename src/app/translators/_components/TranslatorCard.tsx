import { Profile } from "@prisma/client"
import { Icon } from "@iconify/react"
import Link from "next/link"
import { NovelCover } from "./NovelCover"

type TranslatorCardProps = {
  translator: Profile & {
    translatedNovels: Array<{
      id: string
      title: string
      coverImageUrl: string | null
      slug: string
      categories: Array<{
        category: {
          name: string
        }
      }>
    }>
    translatedNovelsCount: number
  }
}

export function TranslatorCard({ translator }: TranslatorCardProps) {
  return (
    <div className="bg-[#f7f3ec] dark:bg-zinc-900 rounded-lg shadow-sm p-4">
      {/* Translator Info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-12 h-12 flex-shrink-0">
          {translator.avatarUrl ? (
            <img
              src={translator.avatarUrl}
              alt={translator.username || "Translator"}
              className="w-full h-full rounded-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Icon icon="mdi:account" className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link 
            href={`/user-dashboard?id=${translator.id}`}
            className="text-base font-semibold hover:text-primary transition-colors line-clamp-1"
          >
            {translator.username || "Anonymous Translator"}
          </Link>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {translator.translatedNovelsCount} Novel{translator.translatedNovelsCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Novels Grid */}
      {translator.translatedNovels.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Translated Novels</h3>
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary">
              {translator.translatedNovels.map((novel) => (
                <Link 
                  key={novel.id}
                  href={`/novels/${novel.slug}`}
                  className="group flex-none w-[100px]"
                >
                  <div className="relative aspect-[2/3] mb-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <NovelCover
                      src={novel.coverImageUrl}
                      alt={novel.title}
                      fill
                      sizes="100px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {novel.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 