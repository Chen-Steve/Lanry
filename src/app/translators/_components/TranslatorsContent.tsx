'use client'

import { useState } from "react"
import { Icon } from "@iconify/react"
import { TranslatorCard } from "./TranslatorCard"
import Pagination from "@/components/Pagination"

type PageInfo = {
  cursors: string[]
  currentPage: number
  hasNextPage: boolean
}

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

interface TranslatorsContentProps {
  translators: TranslatorWithNovels[]
  pageInfo: PageInfo
}

export function TranslatorsContent({ translators, pageInfo }: TranslatorsContentProps) {
  const [isNavigating, setIsNavigating] = useState(false)
  const totalPages = pageInfo.cursors.length

  const handlePageChange = (page: number) => {
    setIsNavigating(true)
    const url = page === 1 ? "/translators" : `/translators?page=${page}`
    window.location.href = url
  }

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
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 col-span-full">
              <Pagination 
                currentPage={pageInfo.currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isNavigating}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}