'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

const Footer = () => {
  return (
    <footer className="bg-white border-t mt-8 sm:mt-16">
      <div className="px-3 py-4 sm:px-4 sm:py-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Left Column - Brand */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex flex-col items-start sm:items-start text-left sm:text-left">
              <Link href="/" className="text-base sm:text-lg font-bold text-gray-800">
                Lanry
              </Link>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Read light novels with ease.
              </p>
              <div className="flex flex-wrap justify-start sm:justify-start gap-2 mt-2">
                <Link 
                  href="https://forms.gle/DV9X9C5wQjUxKece7" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:underline bg-yellow-100 px-2 py-0.5 rounded transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Feedback
                </Link>
                <Link 
                  href="https://forms.gle/dYXhMkxfTi3odiLc8" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:underline bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request Novel
                </Link>
              </div>
            </div>

            {/* Connect Section - Only visible on mobile */}
            <div className="space-y-2 flex flex-col items-start mt-4 sm:hidden">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Connect</h3>
              <div className="flex space-x-3">
                {/* <a
                  href="https://github.com/Chen-Steve/lanry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="GitHub"
                >
                  <Icon icon="mdi:github" className="text-xl sm:text-2xl" />
                </a>
                */}
                <button
                  onClick={() => toast.error('Discord server coming soon!')}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="Discord"
                >
                  <Icon icon="mdi:discord" className="text-xl sm:text-2xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 space-y-2 flex flex-col items-end sm:items-start">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Quick Links</h3>
            <ul className="space-y-1 sm:space-y-2 text-right sm:text-left">
              <li>
                <Link 
                  href="/" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
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
                <Link href="/sponsors" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Sponsors
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Section - Only visible on desktop */}
          <div className="hidden sm:flex space-y-2 flex-col items-start">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Connect</h3>
            <div className="flex space-x-3">
              {/* <a
                href="https://github.com/Chen-Steve/lanry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="GitHub"
              >
                <Icon icon="mdi:github" className="text-xl sm:text-2xl" />
              </a>
              */}
              <button
                onClick={() => toast.error('Discord server coming soon!')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Discord"
              >
                <Icon icon="mdi:discord" className="text-xl sm:text-2xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-4 sm:mt-6 pt-4 sm:pt-6">
          <div className="flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              © {new Date().getFullYear()} Lanry. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link href="/privacy" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Terms
              </Link>
              <Link href="/translation-policy" className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
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