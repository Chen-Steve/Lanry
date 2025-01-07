'use client';

import { Icon } from '@iconify/react';
import { useState } from 'react';

interface AdultContentWarningProps {
  onAccept: () => void;
}

export default function AdultContentWarning({ onAccept }: AdultContentWarningProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleAccept = () => {
    if (isChecked) {
      // Save to localStorage
      localStorage.setItem('adult-content-accepted', 'true');
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-background border border-border rounded-lg shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-center text-red-500">
          <Icon icon="mdi:alert-circle" className="w-16 h-16" />
        </div>
        
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold text-foreground">Adult Content Warning</h2>
          <p className="text-muted-foreground">
            This novel contains adult content and is intended for mature audiences only. 
            By proceeding, you confirm that you are of legal age to view such content in your jurisdiction.
          </p>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <div className="flex h-6 items-center">
            <input
              id="age-confirmation"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              aria-label="Age confirmation checkbox"
            />
          </div>
          <label htmlFor="age-confirmation" className="text-muted-foreground">
            I confirm that I am of legal age to view adult content and accept responsibility for accessing this material.
          </label>
        </div>

        <div className="pt-2">
          <button
            onClick={handleAccept}
            disabled={!isChecked}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isChecked 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-accent text-muted-foreground cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
} 