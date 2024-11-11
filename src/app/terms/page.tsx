import React from 'react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using Lanry, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. User Accounts</h2>
          <div className="prose">
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>You must be at least 13 years old to use this service</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You may not share your account credentials with others</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Content Usage</h2>
          <div className="prose">
            <p className="mb-4 text-gray-700">Users agree to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Use content for personal, non-commercial purposes only</li>
              <li>Not redistribute or copy content without permission</li>
              <li>Not attempt to circumvent any content protection systems</li>
              <li>Respect intellectual property rights of content creators</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Copyright and Licensing</h2>
          <p className="text-gray-700">
            All translations on Lanry are either original works translated with permission, works in the public domain, or works translated under fair use guidelines. Users may not copy, distribute, or create derivative works without explicit permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Prohibited Activities</h2>
          <div className="prose">
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Attempting to access restricted areas of the website</li>
              <li>Using automated systems to access content</li>
              <li>Sharing copyrighted content without permission</li>
              <li>Engaging in any activity that disrupts our services</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Service Modifications</h2>
          <p className="text-gray-700">
            We reserve the right to modify or discontinue any part of our service at any time. We will provide notice of significant changes when possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Termination</h2>
          <p className="text-gray-700">
            We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any violation of these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Contact</h2>
          <p className="text-gray-700">
            For any questions regarding these Terms of Service, please contact us at terms@lanry.com
          </p>
        </section>

        <section>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService; 