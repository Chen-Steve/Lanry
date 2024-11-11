import Link from 'next/link';

export default function NovelNotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold mb-4">Novel Not Found</h1>
      <p className="text-gray-600 mb-6">
        The novel you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/novels"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Back to Novels
      </Link>
    </div>
  );
} 