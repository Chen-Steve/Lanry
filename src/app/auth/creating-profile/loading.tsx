import { Icon } from '@iconify/react';

export default function CreatingProfileLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 relative">
            <Icon 
              icon="svg-spinners:180-ring" 
              className="w-16 h-16 text-primary" 
            />
          </div>
          <h2 className="text-xl font-semibold text-center">Creating Your Profile</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Please wait while we set up your account...
          </p>
        </div>
      </div>
    </div>
  );
} 