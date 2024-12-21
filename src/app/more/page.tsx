import Link from 'next/link';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface MenuItemProps {
  href: string;
  label: string;
  external?: boolean;
  icon?: string;
  bgColor?: string;
}

function MenuItem({ href, label, external, icon, bgColor }: MenuItemProps) {
  const className = `flex items-center justify-between w-full p-4 rounded-lg ${
    bgColor || 'bg-[#F7F4ED]'
  } hover:brightness-95 transition-all border border-gray-300`;
  
  if (external) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-gray-700">{label}</span>
        {icon ? (
          <Icon icon={icon} className="text-xl text-gray-500" />
        ) : (
          <Icon icon="heroicons:arrow-up-right" className="text-xl text-gray-500" />
        )}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <span className="text-gray-700">{label}</span>
      <Icon icon="heroicons:chevron-right" className="text-xl text-gray-500" />
    </Link>
  );
}

export default function MorePage() {
  return (
    <main className="min-h-screen bg-[#F2EEE5] px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Brand Section */}
        <section className="text-center pb-6">
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/lanry.jpg"
              alt="Lanry Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
            <Link href="/" className="text-6xl font-bold text-gray-800">
              Lanry
            </Link>
          </div>
        </section>

        {/* Main Menu */}
        <section className="space-y-3">
          <MenuItem href="/sponsors" label="Sponsors" bgColor="bg-[#F7F4ED]" />
          <MenuItem href="/shop" label="Shop" bgColor="bg-[#F7F4ED]" />
        </section>

        {/* Support Section */}
        <section className="space-y-3">
          <MenuItem 
            href="https://forms.gle/DV9X9C5wQjUxKece7" 
            label="Send Feedback"
            external
            bgColor="bg-yellow-50"
          />
          <MenuItem 
            href="/novels/requests" 
            label="Request Novel"
            bgColor="bg-blue-50"
          />
        </section>

        {/* Social Links */}
        <section className="space-y-3">
          <MenuItem 
            href="https://discord.gg/4CyamqVt" 
            label="Join our Discord"
            icon="mdi:discord"
            external
            bgColor="bg-indigo-50"
          />
        </section>

        {/* Legal Section */}
        <section className="pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-500 text-center mb-4">
            © {new Date().getFullYear()} Lanry. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-800">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-800">
              Terms
            </Link>
            <Link href="/translation-policy" className="text-sm text-gray-600 hover:text-gray-800">
              Translation
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
} 