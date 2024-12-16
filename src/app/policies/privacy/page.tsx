import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
          <div className="prose">
            <p className="mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Email address (for account creation and authentication)</li>
              <li>Username (chosen during account setup)</li>
              <li>Reading history and preferences</li>
              <li>Bookmarked novels</li>
              <li>Usage data and analytics</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
          <div className="prose">
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Track your reading progress</li>
              <li>Recommend novels based on your preferences</li>
              <li>Send notifications about new chapters (if enabled)</li>
              <li>Improve our website and user experience</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Data Storage and Security</h2>
          <p className="text-gray-700">
            We use industry-standard security measures to protect your data. Your information is stored securely using Supabase&apos;s infrastructure, and we regularly review our security practices to ensure your data remains protected.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Cookies and Tracking</h2>
          <p className="text-gray-700">
            We use cookies to maintain your session and remember your preferences. These are essential for the website&apos;s functionality and cannot be disabled. We also use analytics tools to understand how users interact with our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-gray-700">
            We use third-party services for authentication, hosting, and analytics. These services may collect additional information as described in their respective privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us at privacy@lanry.com
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

export default PrivacyPolicy; 