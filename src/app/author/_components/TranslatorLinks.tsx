import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

export default function TranslatorLinks() {
  const [links, setLinks] = useState({
    kofiUrl: '',
    patreonUrl: '',
    customUrl: '',
    customUrlLabel: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('kofi_url, patreon_url, custom_url, custom_url_label')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setLinks({
            kofiUrl: data.kofi_url || '',
            patreonUrl: data.patreon_url || '',
            customUrl: data.custom_url || '',
            customUrlLabel: data.custom_url_label || ''
          });
        }
      } catch (error) {
        console.error('Error loading links:', error);
        toast.error('Failed to load links');
      } finally {
        setIsLoading(false);
      }
    };

    loadLinks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          kofi_url: links.kofiUrl || null,
          patreon_url: links.patreonUrl || null,
          custom_url: links.customUrl || null,
          custom_url_label: links.customUrlLabel || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Links updated successfully');
    } catch (error) {
      console.error('Error saving links:', error);
      toast.error('Failed to save links');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Icon icon="mdi:loading" className="animate-spin text-3xl text-primary/60" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Manage Support Links</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="kofi" className="block text-sm font-medium text-foreground mb-1">
            Ko-fi URL
          </label>
          <div className="flex items-center gap-2">
            <Icon icon="simple-icons:kofi" className="text-[#13C3FF] text-xl" />
            <input
              type="url"
              id="kofi"
              placeholder="https://ko-fi.com/yourusername"
              value={links.kofiUrl}
              onChange={(e) => setLinks(prev => ({ ...prev, kofiUrl: e.target.value }))}
              className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="patreon" className="block text-sm font-medium text-foreground mb-1">
            Patreon URL
          </label>
          <div className="flex items-center gap-2">
            <Icon icon="simple-icons:patreon" className="text-[#FF424D] text-xl" />
            <input
              type="url"
              id="patreon"
              placeholder="https://patreon.com/yourusername"
              value={links.patreonUrl}
              onChange={(e) => setLinks(prev => ({ ...prev, patreonUrl: e.target.value }))}
              className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="custom" className="block text-sm font-medium text-foreground mb-1">
            Custom Support URL
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:link-variant" className="text-muted-foreground text-xl" />
              <input
                type="url"
                id="custom"
                placeholder="https://your-custom-support-link.com"
                value={links.customUrl}
                onChange={(e) => setLinks(prev => ({ ...prev, customUrl: e.target.value }))}
                className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <input
              type="text"
              id="customLabel"
              placeholder="Label for your custom link (e.g., 'Buy Me a Coffee', 'Personal Website')"
              value={links.customUrlLabel}
              onChange={(e) => setLinks(prev => ({ ...prev, customUrlLabel: e.target.value }))}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Add any other support platform or personal website
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-primary-foreground font-medium
            ${isSaving ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}
          `}
        >
          {isSaving && <Icon icon="mdi:loading" className="animate-spin" />}
          Save Links
        </button>
      </div>
    </form>
  );
} 