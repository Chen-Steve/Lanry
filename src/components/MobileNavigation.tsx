import Link from 'next/link';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';

export default function MobileNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'text-primary' : 'text-gray-500';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 md:hidden">
      <div className="flex justify-around items-center">
        <Link href="/" className="flex flex-col items-center">
          <Icon 
            icon="material-symbols:home" 
            className={`w-6 h-6 ${isActive('/')}`} 
          />
          <span className={`text-xs ${isActive('/')}`}>Home</span>
        </Link>
        
        <Link href="/browse" className="flex flex-col items-center">
          <Icon 
            icon="material-symbols:book" 
            className={`w-6 h-6 ${isActive('/browse')}`} 
          />
          <span className={`text-xs ${isActive('/browse')}`}>Browse</span>
        </Link>
        
        <Link href="/forum" className="flex flex-col items-center">
          <Icon 
            icon="material-symbols:forum" 
            className={`w-6 h-6 ${isActive('/forum')}`} 
          />
          <span className={`text-xs ${isActive('/forum')}`}>Forum</span>
        </Link>
        
        <Link href="/user-dashboard" className="flex flex-col items-center">
          <Icon 
            icon="material-symbols:person" 
            className={`w-6 h-6 ${isActive('/user-dashboard')}`} 
          />
          <span className={`text-xs ${isActive('/user-dashboard')}`}>Profile</span>
        </Link>
      </div>
    </nav>
  );
} 