import { Toaster } from 'react-hot-toast';
import Providers from '../providers';

export default function MoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        {children}
        <Toaster position="bottom-right" />
      </div>
    </Providers>
  );
} 