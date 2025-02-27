import Image from "next/image"
import { Icon } from "@iconify/react"
import { ComponentProps } from "react"

type NovelCoverProps = Omit<ComponentProps<typeof Image>, "src"> & {
  src: string | null | undefined
}

export function NovelCover({ src, alt, className, fill, ...props }: NovelCoverProps) {
  if (!src) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <Icon icon="mdi:book-variant" className="w-12 h-12 text-gray-400" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes="(max-width: 768px) 120px, 120px"
      fill={fill}
      {...props}
    />
  )
} 