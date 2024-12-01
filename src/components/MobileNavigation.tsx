import Link from 'next/link';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';

export default function MobileNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (pathname === path) {
      return 'text-gray-900 bg-gray-100 rounded-lg';
    }
    return 'text-gray-500';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 md:hidden">
      <div className="flex justify-around items-center">
        <Link href="/" className={`flex flex-col items-center p-2 ${isActive('/')}`}>
          <Icon 
            icon="pepicons-print:house" 
            className="w-6 h-6" 
          />
          <span className="text-xs">Home</span>
        </Link>
        
        <Link href="/browse" className={`flex flex-col items-center p-2 ${isActive('/browse')}`}>
          <Icon 
            icon="pepicons-print:book" 
            className="w-6 h-6" 
          />
          <span className="text-xs">Browse</span>
        </Link>
        
        <Link href="/forum" className={`flex flex-col items-center p-2 ${isActive('/forum')}`}>
          <Icon 
            icon="pepicons-print:text-bubbles" 
            className="w-6 h-6" 
          />
          <span className="text-xs">Forum</span>
        </Link>
        
        <Link href="/user-dashboard" className={`flex flex-col items-center p-2 ${isActive('/user-dashboard')}`}>
          <Icon 
            icon="pepicons-print:person" 
            className="w-6 h-6" 
          />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </nav>
  );
} 