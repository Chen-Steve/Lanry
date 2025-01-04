import React from 'react';
import Image from 'next/image';

const SponsorsPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Our Sponsors</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sponsor card with logo */}
        <div className="border rounded-lg p-6 shadow-sm bg-background border-border">
          <a 
            aria-label="KARD"
            href="https://kard.space" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <div className="mb-4 relative h-40 w-full">
              <Image
                src="/blob.png"
                alt="Company Logo"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                style={{ objectPosition: 'center' }}
                priority
              />
            </div>
          </a>
          <h2 className="text-2xl font-semibold mb-2 text-foreground">
            <a 
              href="https://kard.space" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              KARD
            </a>
          </h2>
          <p className="text-muted-foreground mb-4">
            A flashcard study platform/Free Quizlet Alternative.
          </p>
        </div>

        {/* Become a Sponsor card */}
        <div className="border rounded-lg p-6 shadow-sm bg-background border-border">
          <h2 className="text-xl font-semibold mb-2 text-foreground">Become a Sponsor</h2>
          <p className="text-muted-foreground mb-4">
            Support our platform and reach our growing community of readers.
          </p>
          <a 
            href="https://forms.gle/BxaaGTJtjTvBq3bJ6" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Apply Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default SponsorsPage; 