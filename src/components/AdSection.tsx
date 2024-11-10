import React from 'react';
import Image from 'next/image';

const AdSection = () => {
  return (
    <div className="hidden lg:block sticky top-4">
        <h2 className="text-xl font-bold mb-4">Sponsors</h2>
        <div className="flex flex-col space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <Image
              src="/blob.png"
              alt="Kard Advertisement"
              width={300}
              height={200}
              className="rounded"
            />
          </div>
        
        </div>
    </div>
  );
};

export default AdSection;