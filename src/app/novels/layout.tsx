import NovelTabs from '@/components/novels/NovelTabs';

export default function NovelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NovelTabs />
      {children}
    </>
  );
} 