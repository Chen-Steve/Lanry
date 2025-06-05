import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

const CompletedNovels = () => {
  const router = useRouter();

  return (
    <div className="my-2">
      <div 
        className="p-4 rounded-lg border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
        style={{
          backgroundImage: 'url(https://vkgkhipasxqxitwlktwz.supabase.co/storage/v1/object/public/stat-section//dither.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={() => router.push('/novels/completed')}
      >
        <div className="absolute inset-0 bg-black/40" />
        <Icon 
          icon="material-symbols:check-circle" 
          className="text-white text-3xl mb-2 relative z-10" 
        />
        <p className="text-white font-medium relative z-10">Completed Novels</p>
      </div>
    </div>
  );
};

export default CompletedNovels; 