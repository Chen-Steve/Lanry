import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { TranslatorCard } from "./_components/TranslatorCard"
import { Icon } from "@iconify/react"
import Link from "next/link"
import { Profile, Novel, NovelCategory } from "@prisma/client"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Translators - Lanry",
  description: "Browse all translators and their novels",
}

type PageInfo = {
  cursors: string[]
  currentPage: number
  hasNextPage: boolean
}

const ITEMS_PER_PAGE = 9
const MAX_PAGES_SHOWN = 5

type TranslatorWithNovels = Profile & {
  authoredNovels: (Novel & {
    categories: {
      category: NovelCategory;
    }[];
  })[];
  _count: {
    authoredNovels: number;
  };
}

async function getTranslators(page: number = 1) {
  try {
    // Get cursors for requested page and surrounding pages
    const startPage = Math.max(1, page - Math.floor(MAX_PAGES_SHOWN / 2))
    const cursors: string[] = []
    let currentCursor: string | undefined = undefined

    // Fetch cursors for the page window
    for (let i = 1; i < startPage + MAX_PAGES_SHOWN; i++) {
      const batch: { id: string }[] = await prisma.profile.findMany({
        where: {
          role: 'TRANSLATOR',
          authoredNovels: { some: {} }
        },
        take: ITEMS_PER_PAGE,
        ...(currentCursor ? {
          skip: 1,
          cursor: { id: currentCursor }
        } : {}),
        select: { id: true },
        orderBy: {
          authoredNovels: {
            _count: 'desc'
          }
        }
      }).catch(() => [] as { id: string }[])
      
      if (batch.length === 0) break
      
      currentCursor = batch[batch.length - 1]?.id
      if (currentCursor) {
        cursors.push(currentCursor)
      }
    }

    // Get actual data for current page
    const skipPages = page - 1
    const cursor = skipPages > 0 && cursors.length > 0 ? cursors[skipPages - 1] : undefined

    const translators = await prisma.profile.findMany({
      where: {
        role: 'TRANSLATOR',
        authoredNovels: { some: {} }
      },
      take: ITEMS_PER_PAGE + 1,
      ...(cursor ? {
        skip: 1,
        cursor: { id: cursor }
      } : {}),
      include: {
        authoredNovels: {
          orderBy: {
            updatedAt: 'desc'
          },
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        },
        _count: {
          select: {
            authoredNovels: true
          }
        }
      },
      orderBy: {
        authoredNovels: {
          _count: 'desc'
        }
      }
    }).catch(() => [] as TranslatorWithNovels[])

    const hasNextPage = translators.length > ITEMS_PER_PAGE
    const displayTranslators = hasNextPage ? translators.slice(0, -1) : translators

    return {
      translators: displayTranslators.map(translator => ({
        ...translator,
        translatedNovels: translator.authoredNovels,
        translatedNovelsCount: translator._count.authoredNovels
      })),
      pageInfo: {
        cursors,
        currentPage: page,
        hasNextPage
      }
    }
  } catch (error) {
    console.error('Error fetching translators:', error)
    // Return a safe default state
    return {
      translators: [],
      pageInfo: {
        cursors: [],
        currentPage: 1,
        hasNextPage: false
      }
    }
  }
}

function Pagination({ pageInfo }: { pageInfo: PageInfo }) {
  const { cursors, currentPage, hasNextPage } = pageInfo
  const startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_SHOWN / 2))
  const endPage = startPage + Math.min(MAX_PAGES_SHOWN - 1, cursors.length)
  
  return (
    <nav className="flex items-center gap-2">
      {currentPage > 1 && (
        <Link
          href={currentPage === 2 ? "/translators" : `/translators?page=${currentPage - 1}`}
          className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          Previous
        </Link>
      )}
      
      {startPage > 1 && (
        <>
          <Link
            href="/translators"
            className={`px-3 py-2 rounded-lg transition-colors ${
              currentPage === 1 ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            1
          </Link>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
        <Link
          key={pageNum}
          href={pageNum === 1 ? "/translators" : `/translators?page=${pageNum}`}
          className={`px-3 py-2 rounded-lg transition-colors ${
            currentPage === pageNum ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          {pageNum}
        </Link>
      ))}

      {hasNextPage && (
        <Link
          href={`/translators?page=${currentPage + 1}`}
          className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  )
}

export default async function TranslatorsPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  try {
    const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1
    const validPage = !isNaN(page) && page > 0 ? page : 1
    const { translators, pageInfo } = await getTranslators(validPage)

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <h1 className="text-3xl font-bold">Translators</h1>
        </div>
        
        {translators.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="mdi:book-off" className="w-16 h-16 mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">No translators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {translators.map((translator) => (
              <TranslatorCard key={translator.id} translator={translator} />
            ))}
            
            <div className="flex justify-center mt-8 col-span-full">
              <Pagination pageInfo={pageInfo} />
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error in TranslatorsPage:', error)
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Icon icon="mdi:alert-circle" className="w-16 h-16 mx-auto text-red-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Something went wrong</h2>
          <p className="mt-2 text-gray-600">We&apos;re having trouble loading the translators. Please try again later.</p>
        </div>
      </div>
    )
  }
} 