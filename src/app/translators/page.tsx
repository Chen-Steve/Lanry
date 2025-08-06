import { Metadata } from "next"
import { createServerClient } from "@/lib/supabaseServer"
import { TranslatorsContent } from "./_components/TranslatorsContent"
import { Icon } from "@iconify/react"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Translators - Lanry",
  description: "Browse all translators and their novels",
}

const ITEMS_PER_PAGE = 9
  
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

  // First, get all translators and their novel counts to determine who has novels
  const { data: allTranslators, error: translatorsError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
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

  // Get novel counts for each translator
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
  
  // If requested page is beyond available pages, return empty
  if (page > totalPages) {
    return {
      translators: [],
      pageInfo: {
        cursors: Array.from({ length: totalPages }, (_, i) => (i + 1).toString()),
        currentPage: page,
        hasNextPage: false
      }
    }
  }

  // Use database-level pagination for the final page
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const pageTranslators = translatorsWithNovels.slice(startIndex, startIndex + ITEMS_PER_PAGE)
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
  type Novel = { id: string; title: string; slug: string; cover_image_url?: string }
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
      authoredNovels: translatorNovels,
      translatedNovels: translatorNovels,
      translatedNovelsCount: translatorNovels.length
    }
  })

  const hasNextPage = page < totalPages

  // Generate cursors for pagination
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