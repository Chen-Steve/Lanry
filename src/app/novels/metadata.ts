import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Novels | Lanry',
  description: 'Browse and read the latest translated light novels, or request new novels for translation on Lanry.',
  alternates: {
    types: {
      'application/rss+xml': [
        {
          title: 'Lanry - Latest Novels RSS Feed',
          url: '/api/rss/novels'
        }
      ]
    }
  }
}; 