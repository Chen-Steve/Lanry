'use client';

const LoadingGrid = () => (
  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-[2/3] bg-gray-200 rounded" />
        <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
        <div className="mt-1 h-3 bg-gray-200 rounded w-1/2" />
      </div>
    ))}
  </div>
);

export default LoadingGrid; 