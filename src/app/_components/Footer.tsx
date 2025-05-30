'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const pathname = usePathname();
  
  // Don't render footer on chapter pages or author dashboard
  if (pathname?.match(/^\/novels\/[^/]+\/c\d+/) || pathname?.startsWith('/author/dashboard')) {
    return null;
  }

  return (
    <footer className="bg-background border-t border-border mt-8 sm:mt-16">
      <div className="px-3 py-4 sm:px-4 sm:py-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex flex-col items-start">
              <Link href="/" className="text-base sm:text-lg font-bold text-foreground">
                Lanry
              </Link>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Read light novels with ease.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link 
                  href="https://discord.gg/DXHRpV3sxF" 
                  className="text-xs sm:text-sm text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50 hover:underline bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Feedback
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/" 
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    if (window.location.pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  Browse Novels
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="col-span-1 space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground">Connect</h3>
            <div className="flex space-x-3">
              <a
                href="https://discord.gg/DXHRpV3sxF"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Discord"
              >
                <Icon icon="mdi:discord" className="text-xl sm:text-2xl" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} Lanry. v3.6.0 All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link href="/policies/privacy" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/policies/terms" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/policies/translation" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Translation Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 