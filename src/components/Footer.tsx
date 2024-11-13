'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

const Footer = () => {
  return (
    <footer className="bg-white border-t mt-16">
      <div className="px-4 py-6 sm:py-8 max-w-5xl mx-auto">
        <div className="space-y-8 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-8 sm:space-y-0">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-800">
              Lanry
            </Link>
            <p className="mt-2 text-sm text-gray-600">
              Read light novels with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Link 
                href="https://forms.gle/DV9X9C5wQjUxKece7" 
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline bg-yellow-100 px-2 py-1 rounded transition-colors text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Any feedback for us?
              </Link>
              <Link 
                href="https://forms.gle/dYXhMkxfTi3odiLc8" 
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline bg-blue-100 px-2 py-1 rounded transition-colors text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Request a novel translation
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 flex flex-col items-center sm:items-start">
            <h3 className="text-sm font-semibold text-gray-800">Quick Links</h3>
            <ul className="space-y-3 text-center sm:text-left">
              <li>
                <Link 
                  href="/" 
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
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
                <Link href="/sponsors" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Sponsors
                </Link>
              </li>
              <li>
                <Link href="/translation-policy" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Translation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-3 flex flex-col items-center sm:items-start">
            <h3 className="text-sm font-semibold text-gray-800">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/Chen-Steve/lanry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="GitHub"
              >
                <Icon icon="mdi:github" className="text-2xl" />
              </a>
              <button
                onClick={() => toast.error('Discord server coming soon!')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Discord"
              >
                <Icon icon="mdi:discord" className="text-2xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-6 sm:mt-8 pt-6">
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
            <p className="text-sm text-gray-600 text-center sm:text-left">
              © {new Date().getFullYear()} Lanry. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 