import React from 'react';

const TranslationPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Translation Policy</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Translation Guidelines</h2>
          <div className="prose dark:prose-invert">
            <p className="mb-4 text-foreground">All translations on Lanry must:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Be original works translated with proper authorization</li>
              <li>Maintain the original meaning and context</li>
              <li>Credit original authors appropriately</li>
              <li>Follow our quality standards</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Copyright and Permissions</h2>
          <div className="prose dark:prose-invert">
            <p className="mb-4 text-foreground">Translators must ensure:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>They have proper rights or permissions to translate the work</li>
              <li>The original work is eligible for translation</li>
              <li>All necessary licenses and agreements are in place</li>
              <li>Proper attribution is maintained throughout</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Quality Standards</h2>
          <div className="prose dark:prose-invert">
            <p className="mb-4 text-foreground">Translations should maintain:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground">
              <li>Accuracy to the original text</li>
              <li>Proper grammar and spelling</li>
              <li>Consistent terminology</li>
              <li>Cultural context where appropriate</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Review Process</h2>
          <p className="text-muted-foreground">
            All translations undergo a review process to ensure quality and accuracy. This may include peer review, editorial review, and community feedback when appropriate.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Content Removal</h2>
          <p className="text-muted-foreground">
            We reserve the right to remove translations that violate copyright laws, our quality standards, or community guidelines. Translators will be notified of any such actions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Translator Rights</h2>
          <p className="text-muted-foreground">
            Translators retain appropriate credit for their work while granting Lanry the right to host and distribute the translations according to our terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Updates and Changes</h2>
          <p className="text-muted-foreground">
            This translation policy may be updated periodically. Translators will be notified of significant changes that affect their work or rights.
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

export default TranslationPolicy; 