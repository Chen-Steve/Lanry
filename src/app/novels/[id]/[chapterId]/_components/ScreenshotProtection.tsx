import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface ScreenshotProtectionProps {
  children: React.ReactNode;
}

export default function ScreenshotProtection({ children }: ScreenshotProtectionProps) {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleScreenshot = () => {
      setIsBlurred(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBlurred) {
        setIsBlurred(false);
        return;
      }

      // Screenshot detection
      if (
        // Windows: Win + Shift + S
        (e.shiftKey && (e.metaKey || e.ctrlKey)) || 
        // PrintScreen key
        e.key === 'PrintScreen' ||
        // Fn + F6
        e.key === 'F6'
      ) {
        e.preventDefault();
        handleScreenshot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only unblur for modifier keys, not for F6 or PrintScreen
      if (
        !isBlurred || // Don't unblur if already blurred
        e.key === 'F6' || // Don't unblur for F6
        e.key === 'PrintScreen' || // Don't unblur for PrintScreen
        e.key === 'Meta' || // Don't unblur for Windows key
        e.key === 'Control' || // Don't unblur for Ctrl
        e.key === 'Shift' // Don't unblur for Shift
      ) {
        return;
      }

      // Only unblur if no modifier keys are pressed
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setIsBlurred(false);
      }
    };

    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Prevent right-click and context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleScreenshot();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Detect clipboard operations
    const handleClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      handleScreenshot();
    };
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('cut', handleClipboard);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
    };
  }, [isBlurred]);

  return (
    <div className="relative">
      <div
        className={`transition-all duration-300 select-none ${
          isBlurred ? 'blur-3xl opacity-25 grayscale pointer-events-none' : ''
        }`}
        style={{
          WebkitUserSelect: isBlurred ? 'none' : 'auto',
          MozUserSelect: isBlurred ? 'none' : 'auto',
          userSelect: isBlurred ? 'none' : 'auto'
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </div>

      {isBlurred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md mx-4 text-center">
            <div className="flex justify-center mb-4">
              <Icon
                icon="mdi:shield-alert"
                className="w-12 h-12 text-red-500"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Nice Try! 😏
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Sneaky, sneaky! But our authors&apos; content is too precious to steal.
              How about supporting them properly instead?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsBlurred(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Okay, My Bad!
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Press ESC if you promise to behave 😉
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 