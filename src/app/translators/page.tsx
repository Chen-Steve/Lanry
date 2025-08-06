import { Metadata } from "next"
import { createServerClient } from "@/lib/supabaseServer"
import { TranslatorCard } from "./_components/TranslatorCard"
import { Icon } from "@iconify/react"
import Link from "next/link"

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

type TranslatorWithNovels = {
  id: string;
  username: string | null;
  avatar_url?: string;
  authoredNovels: {
    id: string;
    title: string;
    slug: string;
    cover_image_url?: string;
  }[];
  translatedNovels: {
    id: string;
    title: string;
    slug: string;
    cover_image_url?: string;
  }[];
  translatedNovelsCount: number;
}

async function getTranslators(page: number = 1) {
  const supabase = await createServerClient()

  // Get all translator profiles - simple and straightforward
  const { data: allTranslators, error: translatorsError } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      avatar_url,
      role
    `)
    .eq('role', 'TRANSLATOR')

  if (translatorsError) {
    throw translatorsError
  }

  if (!allTranslators || allTranslators.length === 0) {
    return {
      translators: [],
      pageInfo: {
        cursors: [],
        currentPage: 1,
        hasNextPage: false
      }
    }
  }

    const translatorIds = allTranslators.map(t => t.id)

    // Get novel counts for each translator (both authored and translated)
    const { data: novelCounts, error: countsError } = await supabase
      .from('novels')
      .select('author_profile_id, translator_id')
      .or(`author_profile_id.in.(${translatorIds.join(',')}),translator_id.in.(${translatorIds.join(',')})`)
      .neq('status', 'DRAFT')

    if (countsError) {
      throw countsError
    }

    // Calculate novel counts for each translator
    const translatorNovelCounts: Record<string, number> = {}
    novelCounts?.forEach(novel => {
      if (novel.author_profile_id && translatorIds.includes(novel.author_profile_id)) {
        translatorNovelCounts[novel.author_profile_id] = (translatorNovelCounts[novel.author_profile_id] || 0) + 1
      }
      if (novel.translator_id && translatorIds.includes(novel.translator_id)) {
        translatorNovelCounts[novel.translator_id] = (translatorNovelCounts[novel.translator_id] || 0) + 1
      }
    })

    // Filter translators who have novels and sort by novel count
    const translatorsWithNovels = allTranslators
      .filter(translator => (translatorNovelCounts[translator.id] || 0) > 0)
      .map(translator => ({
        ...translator,
        totalNovels: translatorNovelCounts[translator.id] || 0
      }))
      .sort((a, b) => b.totalNovels - a.totalNovels)

    if (translatorsWithNovels.length === 0) {
      return {
        translators: [],
        pageInfo: {
          cursors: [],
          currentPage: 1,
          hasNextPage: false
        }
      }
    }

    // Calculate pagination
    const totalTranslators = translatorsWithNovels.length
    const totalPages = Math.ceil(totalTranslators / ITEMS_PER_PAGE)
    
    // If requested page is beyond available pages, redirect to page 1
    if (page > totalPages) {
      return {
        translators: [],
        pageInfo: {
          cursors: Array.from({ length: totalPages }, (_, i) => (i + 1).toString()),
          currentPage: 1,
          hasNextPage: false
        }
      }
    }

    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const hasNextPage = page < totalPages

    // Get the translators for the current page
    const pageTranslators = translatorsWithNovels.slice(startIndex, endIndex)
    const pageTranslatorIds = pageTranslators.map(t => t.id)

    // Fetch detailed novel data for the current page translators only
    const { data: novels, error: novelsError } = await supabase
      .from('novels')
      .select(`
        id,
        title,
        slug,
        cover_image_url,
        author_profile_id,
        translator_id
      `)
      .or(`author_profile_id.in.(${pageTranslatorIds.join(',')}),translator_id.in.(${pageTranslatorIds.join(',')})`)
      .neq('status', 'DRAFT')
      .order('updated_at', { ascending: false })

    if (novelsError) {
      throw novelsError
    }

    // Group novels by translator
    type Novel = {
      id: string;
      title: string;
      slug: string;
      cover_image_url?: string;
    }

    const novelsByTranslator: Record<string, Novel[]> = {}
    novels?.forEach((novel) => {
      const authorId = novel.author_profile_id
      const translatorId = novel.translator_id

      // Add to authored novels
      if (authorId && pageTranslatorIds.includes(authorId)) {
        if (!novelsByTranslator[authorId]) {
          novelsByTranslator[authorId] = []
        }
        novelsByTranslator[authorId].push({
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          cover_image_url: novel.cover_image_url
        })
      }

      // Add to translated novels (if different from author)
      if (translatorId && pageTranslatorIds.includes(translatorId) && translatorId !== authorId) {
        if (!novelsByTranslator[translatorId]) {
          novelsByTranslator[translatorId] = []
        }
        novelsByTranslator[translatorId].push({
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          cover_image_url: novel.cover_image_url
        })
      }
    })

    // Build final translator data
    const displayTranslators: TranslatorWithNovels[] = pageTranslators.map(translator => {
      const translatorNovels = novelsByTranslator[translator.id] || []
      
      return {
        id: translator.id,
        username: translator.username,
        avatar_url: translator.avatar_url,
        role: translator.role,
        authoredNovels: translatorNovels,
        translatedNovels: translatorNovels,
        translatedNovelsCount: translatorNovels.length
      }
    })

    // Generate cursors for pagination - only for pages with content
    const cursors = Array.from(
      { length: totalPages }, 
      (_, i) => (i + 1).toString()
    )

    return {
      translators: displayTranslators,
      pageInfo: {
        cursors,
        currentPage: page,
        hasNextPage
      }
    }
}

function Pagination({ pageInfo }: { pageInfo: PageInfo }) {
  const { cursors, currentPage } = pageInfo
  const totalPages = cursors.length
  
  // Calculate the range of pages to show
  let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_SHOWN / 2))
  const endPage = Math.min(startPage + MAX_PAGES_SHOWN - 1, totalPages)
  
  // Adjust startPage if we're near the end
  if (endPage - startPage + 1 < MAX_PAGES_SHOWN) {
    startPage = Math.max(1, endPage - MAX_PAGES_SHOWN + 1)
  }
  
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

      {currentPage < totalPages && (
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
        <TranslatorsContent translators={translators} pageInfo={pageInfo} />
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

function TranslatorsContent({ translators, pageInfo }: { translators: TranslatorWithNovels[], pageInfo: PageInfo }) {
  return (
    <>
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
    </>
  )
}