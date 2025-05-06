import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function TranslatorLinks() {
  const [links, setLinks] = useState({
    kofiUrl: '',
    patreonUrl: '',
    customUrl: '',
    customUrlLabel: '',
    authorBio: ''
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
          .select('kofi_url, patreon_url, custom_url, custom_url_label, author_bio')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setLinks({
            kofiUrl: data.kofi_url || '',
            patreonUrl: data.patreon_url || '',
            customUrl: data.custom_url || '',
            customUrlLabel: data.custom_url_label || '',
            authorBio: data.author_bio || ''
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
          author_bio: links.authorBio || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[150px]">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-primary/60" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-foreground mb-4">Manage Profile</h2>
      
      <div className="space-y-3">
        <div>
          <label htmlFor="authorBio" className="block text-sm font-medium text-foreground mb-1">
            Bio
          </label>
          <div className="relative">
            <textarea
              id="authorBio"
              placeholder="Tell readers about yourself..."
              value={links.authorBio}
              onChange={(e) => setLinks(prev => ({ ...prev, authorBio: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              maxLength={500}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Maximum 500 characters
          </p>
        </div>

        <div>
          <label htmlFor="kofi" className="block text-sm font-medium text-foreground mb-1">
            Ko-fi URL
          </label>
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <Icon icon="simple-icons:kofi" className="text-[#13C3FF] text-lg" />
            </div>
            <input
              type="url"
              id="kofi"
              placeholder="https://ko-fi.com/yourusername"
              value={links.kofiUrl}
              onChange={(e) => setLinks(prev => ({ ...prev, kofiUrl: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="patreon" className="block text-sm font-medium text-foreground mb-1">
            Patreon URL
          </label>
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <Icon icon="simple-icons:patreon" className="text-[#FF424D] text-lg" />
            </div>
            <input
              type="url"
              id="patreon"
              placeholder="https://patreon.com/yourusername"
              value={links.patreonUrl}
              onChange={(e) => setLinks(prev => ({ ...prev, patreonUrl: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="custom" className="block text-sm font-medium text-foreground mb-1">
            Custom Support URL
          </label>
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                <Icon icon="mdi:link-variant" className="text-muted-foreground text-lg" />
              </div>
              <input
                type="url"
                id="custom"
                placeholder="https://your-custom-support-link.com"
                value={links.customUrl}
                onChange={(e) => setLinks(prev => ({ ...prev, customUrl: e.target.value }))}
                className="w-full pl-9 pr-3 py-1.5 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              />
            </div>
            <input
              type="text"
              id="customLabel"
              placeholder="Label (e.g., 'Buy Me a Coffee')"
              value={links.customUrlLabel}
              onChange={(e) => setLinks(prev => ({ ...prev, customUrlLabel: e.target.value }))}
              className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Add any other support platform or personal website
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-primary-foreground text-sm font-medium
            ${isSaving ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}
          `}
        >
          {isSaving && <Icon icon="mdi:loading" className="animate-spin text-sm" />}
          Save Profile
        </button>
      </div>
    </form>
  );
} 