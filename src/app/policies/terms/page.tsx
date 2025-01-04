import React from 'react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Terms of Service</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using Lanry, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">User Accounts</h2>
          <div className="prose dark:prose-invert">
            <p className="mb-4 text-foreground">When creating an account, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Content Guidelines</h2>
          <div className="prose dark:prose-invert">
            <p className="mb-4 text-foreground">Users must not:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Post inappropriate, offensive, or illegal content</li>
              <li>Violate intellectual property rights</li>
              <li>Engage in harassment or bullying</li>
              <li>Attempt to manipulate or abuse the platform</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Service Modifications</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify, suspend, or discontinue any part of our service at any time. We will provide notice when possible but are not obligated to do so.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Intellectual Property</h2>
          <p className="text-muted-foreground">
            All content provided on Lanry, including but not limited to text, graphics, logos, and software, is the property of Lanry or its content suppliers and is protected by international copyright laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Limitation of Liability</h2>
          <p className="text-muted-foreground">
            Lanry is provided &quot;as is&quot; without any warranties. We are not liable for any damages arising from the use or inability to use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Changes to Terms</h2>
          <p className="text-muted-foreground">
            We may update these terms from time to time. Continued use of Lanry after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService; 