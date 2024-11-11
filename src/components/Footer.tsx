import Link from 'next/link';
import { Icon } from '@iconify/react';

const Footer = () => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Lanry
            </Link>
            <p className="mt-2 text-sm text-gray-600">
              A modern database for light novel enthusiasts, making it easy to discover and track your favorite novels.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/novels" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Browse Novels
                </Link>
              </li>
              <li>
                <Link href="/sponsors" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Sponsors
                </Link>
              </li>
              <li>
                <span className="text-sm text-gray-600 cursor-not-allowed">
                  Forum (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="GitHub"
              >
                <Icon icon="mdi:github" className="text-2xl" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Twitter"
              >
                <Icon icon="mdi:twitter" className="text-2xl" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Discord"
              >
                <Icon icon="mdi:discord" className="text-2xl" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Lanry. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
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