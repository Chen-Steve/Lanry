import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/database';

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    username: '',
    email_notifications: false,
    theme: 'light',
    created_at: '',
    updated_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
      <form onSubmit={saveSettings} className="max-w-md space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input
            aria-label="Username"
            type="text"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={profile.email_notifications}
              onChange={(e) => setProfile({ ...profile, email_notifications: e.target.checked })}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium">Email notifications</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            aria-label="Theme"
            value={profile.theme}
            onChange={(e) => setProfile({ ...profile, theme: e.target.value as 'light' | 'dark' })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
} 