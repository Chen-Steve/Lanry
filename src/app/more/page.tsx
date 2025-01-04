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
    bgColor || 'bg-background'
  } hover:brightness-95 transition-all border border-border`;
  
  if (external) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-foreground">{label}</span>
        {icon ? (
          <Icon icon={icon} className="text-xl text-muted-foreground" />
        ) : (
          <Icon icon="heroicons:arrow-up-right" className="text-xl text-muted-foreground" />
        )}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <span className="text-foreground">{label}</span>
      <Icon icon="heroicons:chevron-right" className="text-xl text-muted-foreground" />
    </Link>
  );
}

export default function MorePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6">
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
            <Link href="/" className="text-6xl font-bold text-foreground">
              Lanry
            </Link>
          </div>
        </section>

        {/* Main Menu */}
        <section className="space-y-3">
          <MenuItem href="/sponsors" label="Sponsors" bgColor="bg-background" />
          <MenuItem href="/shop" label="Shop" bgColor="bg-background" />
        </section>

        {/* Support Section */}
        <section className="space-y-3">
          <MenuItem 
            href="https://forms.gle/DV9X9C5wQjUxKece7" 
            label="Send Feedback"
            external
            bgColor="bg-yellow-500/10 dark:bg-yellow-500/5"
          />
          <MenuItem 
            href="/novels/requests" 
            label="Request Novel"
            bgColor="bg-primary/10"
          />
        </section>

        {/* Social Links */}
        <section className="space-y-3">
          <MenuItem 
            href="https://discord.gg/4CyamqVt" 
            label="Join our Discord"
            icon="mdi:discord"
            external
            bgColor="bg-indigo-500/10 dark:bg-indigo-500/5"
          />
        </section>

        {/* Legal Section */}
        <section className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center mb-4">
            © {new Date().getFullYear()} Lanry. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/translation-policy" className="text-sm text-muted-foreground hover:text-foreground">
              Translation
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
} 