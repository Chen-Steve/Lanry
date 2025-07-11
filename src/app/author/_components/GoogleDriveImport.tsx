/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';

interface Props {
  novelId: string;
}

// Dynamically load Google APIs JS
function loadGapi(): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('gapi-script');
    if (existing) {
      if ((window as any).gapi) resolve((window as any).gapi);
      else existing.addEventListener('load', () => resolve((window as any).gapi));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.id = 'gapi-script';
    script.onload = () => resolve((window as any).gapi);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function GoogleDriveImport({ novelId }: Props) {
  const [loading, setLoading] = useState(false);

  async function openPicker() {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      toast.error('Missing Google Client ID');
      return;
    }
    setLoading(true);
    try {
      const gapi = await loadGapi();

      await new Promise<void>((res) => gapi.load('picker', { callback: () => res() }));

      const tokenRes = await fetch('/api/google/token');
      const tokenJson = await tokenRes.json();
      const oauthToken = tokenJson.access_token as string | undefined;

      if (!oauthToken) {
        toast.error('Google account not connected.');
        setLoading(false);
        return;
      }

      // build picker
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Google Picker no types
      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS)
        .setOAuthToken(oauthToken)
        .setDeveloperKey('') // not strictly needed for OAuth-only
        .setCallback(async (data: any) => {
          if (data.action === 'picked') {
            const fileIds = data.docs.map((d: any) => d.id);
            const res = await fetch('/api/google/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileIds, novelId }),
            });
            const json = await res.json();
            if (res.ok) toast.success(`Imported ${json.imported.length} files`);
            else toast.error(json.error || 'Import failed');
          }
          setLoading(false);
        })
        .build();

      picker.setVisible(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load picker');
      setLoading(false);
    }
  }

  return (
    <button
      className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-xs"
      disabled={loading}
      onClick={openPicker}
    >
      {loading ? <Icon icon="mdi:loading" className="animate-spin" /> : <Icon icon="mdi:cloud-upload" />} Import from Drive
    </button>
  );
} 