import QueryProvider from '@/providers/QueryProvider'
import { ReactNode } from 'react'

interface ForumLayoutProps {
  children: ReactNode
}

export default function ForumLayout({ children }: ForumLayoutProps) {
  return <QueryProvider>{children}</QueryProvider>
} 