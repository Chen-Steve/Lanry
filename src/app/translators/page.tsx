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
  role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  created_at: string;
  updated_at: string;
  kofi_url?: string | null;
  patreon_url?: string | null;
  custom_url?: string | null;
  custom_url_label?: string | null;
  author_bio?: string | null;
  authoredNovels: {
    id: string;
    title: string;
    slug: string;
    cover_image_url?: string;
    status: string;
    updated_at: string;
    categories: {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
    }[];
  }[];
  translatedNovels: {
    id: string;
    title: string;
    slug: string;
    cover_image_url?: string;
    status: string;
    updated_at: string;
    categories: {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
    }[];
  }[];
  translatedNovelsCount: number;
}

async function getTranslators(page: number = 1) {
  try {
    const supabase = createServerClient()

    // Get all translator profiles - simple and straightforward
    const { data: allTranslators, error: translatorsError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        avatar_url,
        role,
        created_at,
        updated_at,
        kofi_url,
        patreon_url,
        custom_url,
        custom_url_label,
        author_bio
      `)
      .eq('role', 'TRANSLATOR')

    if (translatorsError) {
      console.error('Error fetching translators:', translatorsError)
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
      console.error('Error fetching novel counts:', countsError)
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
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const hasNextPage = page < totalPages

    // Get the translators for the current page
    const pageTranslators = translatorsWithNovels.slice(startIndex, endIndex)
    const pageTranslatorIds = pageTranslators.map(t => t.id)

    if (pageTranslatorIds.length === 0) {
      return {
        translators: [],
        pageInfo: {
          cursors: [],
          currentPage: page,
          hasNextPage: false
        }
      }
    }

    // Fetch detailed novel data for the current page translators only
    const { data: novels, error: novelsError } = await supabase
      .from('novels')
      .select(`
        id,
        title,
        slug,
        cover_image_url,
        status,
        updated_at,
        author_profile_id,
        translator_id,
        categories:categories_on_novels(
          category:category_id(
            id,
            name,
            created_at,
            updated_at
          )
        )
      `)
      .or(`author_profile_id.in.(${pageTranslatorIds.join(',')}),translator_id.in.(${pageTranslatorIds.join(',')})`)
      .neq('status', 'DRAFT')
      .order('updated_at', { ascending: false })

    if (novelsError) {
      console.error('Error fetching novels:', novelsError)
      throw novelsError
    }

    // Group novels by translator
    type NovelWithCategories = {
      id: string;
      title: string;
      slug: string;
      cover_image_url?: string;
      status: string;
      updated_at: string;
      categories: {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
      }[];
    }

    const novelsByTranslator: Record<string, NovelWithCategories[]> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    novels?.forEach((novel: any) => {
      const authorId = novel.author_profile_id
      const translatorId = novel.translator_id

      // Add to authored novels
      if (authorId && pageTranslatorIds.includes(authorId)) {
        if (!novelsByTranslator[authorId]) {
          novelsByTranslator[authorId] = []
        }
        novelsByTranslator[authorId].push({
          ...novel,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categories: novel.categories?.map((c: any) => c.category) || []
        })
      }

      // Add to translated novels (if different from author)
      if (translatorId && pageTranslatorIds.includes(translatorId) && translatorId !== authorId) {
        if (!novelsByTranslator[translatorId]) {
          novelsByTranslator[translatorId] = []
        }
        novelsByTranslator[translatorId].push({
          ...novel,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categories: novel.categories?.map((c: any) => c.category) || []
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
        created_at: translator.created_at,
        updated_at: translator.updated_at,
        kofi_url: translator.kofi_url,
        patreon_url: translator.patreon_url,
        custom_url: translator.custom_url,
        custom_url_label: translator.custom_url_label,
        author_bio: translator.author_bio,
        authoredNovels: translatorNovels,
        translatedNovels: translatorNovels,
        translatedNovelsCount: translatorNovels.length
      }
    })

    // Generate cursors for pagination
    const cursors: string[] = []
    for (let i = 1; i <= Math.min(totalPages, MAX_PAGES_SHOWN); i++) {
      cursors.push(i.toString())
    }

    return {
      translators: displayTranslators,
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