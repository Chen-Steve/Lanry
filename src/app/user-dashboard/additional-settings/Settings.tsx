'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Settings() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  return (
    <div className="p-3">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Additional Settings</h2>
        
        <div className="space-y-4">
          {/* Add your additional settings here */}
          <div className="text-sm text-muted-foreground">
            More settings coming soon...
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white z-50`}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={toast.type === 'success' ? 'ph:check-circle' : 'ph:x-circle'}
                className="w-5 h-5"
              />
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 hover:opacity-80"
                aria-label="Close notification"
              >
                <Icon icon="ph:x" className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 