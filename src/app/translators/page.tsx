import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { TranslatorCard } from "./_components/TranslatorCard"
import { Icon } from "@iconify/react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Translators - Lanry",
  description: "Browse all translators and their novels",
}

async function getTranslators(page: number = 1) {
  const itemsPerPage = 9

  // First get all profiles that are translators with their novel counts
  const translatorsWithCount = await prisma.profile.findMany({
    where: {
      role: 'TRANSLATOR',
      authoredNovels: { some: {} } // Only get translators who have novels
    },
    select: {
      id: true,
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
  })

  // Get total count
  const total = translatorsWithCount.length

  // Get paginated translators with full data
  const paginatedTranslatorIds = translatorsWithCount
    .slice((page - 1) * itemsPerPage, page * itemsPerPage)
    .map(t => t.id)

  // Fetch full data for paginated translators
  const translatorsWithNovels = await prisma.profile.findMany({
    where: {
      id: {
        in: paginatedTranslatorIds
      }
    },
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
      }
    },
    orderBy: {
      authoredNovels: {
        _count: 'desc'
      }
    }
  })
  
  // Sort the translators to match the original order from translatorsWithCount
  const orderedTranslators = paginatedTranslatorIds
    .map(id => translatorsWithNovels.find(t => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
  
  return { 
    translators: orderedTranslators.map(translator => ({
      ...translator,
      translatedNovels: translator.authoredNovels,
      translatedNovelsCount: translatorsWithCount.find(t => t.id === translator.id)?._count.authoredNovels || 0
    })), 
    total 
  }
}

export default async function TranslatorsPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1
  const { translators, total } = await getTranslators(page)
  const totalPages = Math.ceil(total / 9)

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
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination currentPage={page} totalPages={totalPages} basePath="/translators" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Pagination({ currentPage, totalPages, basePath }: { 
  currentPage: number
  totalPages: number
  basePath: string
}) {
  return (
    <nav className="flex items-center gap-4">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          Previous
        </Link>
      )}
      
      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  )
} 