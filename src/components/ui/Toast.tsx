import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'loading';

interface ToastProps {
  message: string;
  type: ToastType;
  id: string;
  onClose: (id: string) => void;
}

export function Toast({ message, type, id, onClose }: ToastProps) {
  useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(() => {
        onClose(id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [id, onClose, type]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    loading: 'bg-blue-500',
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px]`}
    >
      <div className="flex items-center gap-2">
        {type === 'loading' && (
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        )}
        <p>{message}</p>
      </div>
      {type !== 'loading' && (
        <button
          onClick={() => onClose(id)}
          className="text-white hover:text-gray-200"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
} 