/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import GoogleDriveImport from './GoogleDriveImport';
import { Icon } from '@iconify/react';

interface Props {
  novelId: string;
}

export default function AuthorDriveSection({ novelId }: Props) {
  const { isConnected, loading, connect } = useGoogleDrive();

  return (
    <div className="space-y-2">
      {loading ? (
        <Icon icon="mdi:loading" className="animate-spin text-foreground" />
      ) : isConnected ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-600 flex items-center gap-1"><Icon icon="mdi:check-circle" /> Connected</span>
          <GoogleDriveImport novelId={novelId} />
        </div>
      ) : (
        <button
          onClick={connect}
          className="px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
        >
          Connect Google Drive
        </button>
      )}
    </div>
  );
}
