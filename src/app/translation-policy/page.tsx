import React from 'react';

const TranslationPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Translation Policy</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Our Translation Standards</h2>
          <p className="text-gray-700 mb-4">
            At Lanry, we are committed to providing high-quality translations while respecting intellectual property rights. 
            Our translations are created by dedicated fans who share a passion for making these works accessible to a global audience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Licensed Works</h2>
          <div className="prose">
            <p className="text-gray-700 mb-4">
              We actively pursue licensing agreements with original publishers and authors. Licensed works on our platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Are translated with explicit permission from rights holders</li>
              <li>Support original creators through revenue sharing</li>
              <li>Maintain high-quality standards through professional editing</li>
              <li>Receive regular updates and quality improvements</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Fan Translations</h2>
          <div className="prose">
            <p className="text-gray-700 mb-4">
              For non-licensed works, we operate under fair use principles and follow these guidelines:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Translations are removed upon request from copyright holders</li>
              <li>We encourage readers to support official releases when available</li>
              <li>Fan translations are not monetized</li>
              <li>Original author and source are always credited</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Regional Considerations</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Chinese Works (网文/Web Novels)</h3>
              <p className="text-gray-700">
                We respect China&apos;s copyright laws and work with platforms like Qidian/Webnovel for official translations. 
                Fan translations of unlicensed works are subject to removal upon official licensing.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Korean Works (웹소설/Web Novels)</h3>
              <p className="text-gray-700">
                We follow Korean copyright guidelines and collaborate with Korean publishers for licensing. 
                We actively monitor official Korean releases and adjust our content accordingly.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Takedown Procedures</h2>
          <p className="text-gray-700 mb-4">
            Rights holders can request content removal through our DMCA process:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>Submit a formal request through our <a href="https://forms.gle/oz7pFHRrVDnvYEJ58" className="text-blue-600 hover:text-blue-800 underline">DMCA takedown form</a></li>
              <li>Provide proof of copyright ownership</li>
              <li>Identify the specific content for removal</li>
              <li>Content will be removed within 24-48 hours of verification</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">For Translators</h2>
          <div className="prose">
            <p className="text-gray-700 mb-4">
              If you&apos;re interested in contributing translations:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Join our translation team through the application process on Discord</li>
              <li>Follow our quality guidelines and style guide</li>
              <li>Participate in our translator community</li>
              <li>Receive recognition and potential compensation for licensed works</li>
            </ul>
          </div>
        </section>

        <section>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700">
              For licensing inquiries or translation partnerships, please contact us at licensing@lanry.com
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TranslationPolicyPage; 