import { Icon } from "@iconify/react"

type NovelCoverProps = {
  src: string | null | undefined
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
}

export function NovelCover({ 
  src, 
  alt, 
  className = '', 
  fill = false,
  sizes = '(max-width: 768px) 120px, 120px',
  priority = false,
  loading = 'lazy'
}: NovelCoverProps) {
  if (!src) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <Icon icon="mdi:book-variant" className="w-12 h-12 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${fill ? 'w-full h-full object-cover' : ''}`}
      sizes={sizes}
      loading={priority ? 'eager' : loading}
    />
  )
} 