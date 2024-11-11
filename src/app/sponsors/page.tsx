import React from 'react';
import Image from 'next/image';

const SponsorsPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Sponsors</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sponsor card with logo */}
        <div className="border rounded-lg p-6 shadow-sm">
          <div className="mb-4 relative h-40 w-full">
            <Image
              src="/blob.png"
              alt="Company Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-semibold mb-2">KARD</h2>
          <p className="text-gray-600 mb-4">
            A flashcard study platform/Free Quizlet Alternative.
          </p>
        </div>

        {/* Become a Sponsor card */}
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Become a Sponsor</h2>
          <p className="text-gray-600 mb-4">
            Support our platform and reach our growing community of readers.
          </p>
          <a 
            href="https://forms.gle/BxaaGTJtjTvBq3bJ6" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Apply Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default SponsorsPage; 