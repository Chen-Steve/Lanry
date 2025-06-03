import { createServerClient } from '@/lib/supabaseServer';

export interface TopSupporter {
  profile_id: string;
  username: string | null;
  avatar_url?: string;
  total_coins: number;
  role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  author_bio?: string | null;
  kofi_url?: string | null;
  patreon_url?: string | null;
}

interface TransactionWithProfile {
  profile_id: string;
  amount: number;
  profiles: {
    username: string | null;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
    author_bio?: string | null;
    kofi_url?: string | null;
    patreon_url?: string | null;
  };
}

export async function getTopSupporters(): Promise<TopSupporter[]> {
  const supabase = createServerClient();
  
  // Get all purchase transactions and join with profiles
  const { data, error } = await supabase
    .from('coin_transactions')
    .select(`
      profile_id,
      amount,
      type,
      profiles!inner (
        username,
        avatar_url,
        role,
        author_bio,
        kofi_url,
        patreon_url
      )
    `)
    .in('type', ['PURCHASE', 'SUBSCRIPTION_BONUS'])
    .not('profiles.role', 'eq', 'TRANSLATOR');

  if (error) {
    console.error('Error fetching supporters:', error);
    return [];
  }

  // Aggregate transactions by user
  const userTotals: Record<string, TopSupporter> = {};
  
  (data as unknown as TransactionWithProfile[])?.forEach(transaction => {
    const profileId = transaction.profile_id;
    const amount = transaction.amount;
    const profile = transaction.profiles;

    if (!userTotals[profileId]) {
      userTotals[profileId] = {
        profile_id: profileId,
        username: profile.username || 'Anonymous',
        avatar_url: profile.avatar_url,
        role: profile.role || 'USER',
        author_bio: profile.author_bio,
        kofi_url: profile.kofi_url,
        patreon_url: profile.patreon_url,
        total_coins: 0
      };
    }
    
    // Only count positive amounts
    if (amount > 0) {
      userTotals[profileId].total_coins += amount;
    }
  });

  // Convert to array and sort by total coins
  const sortedSupporters = Object.values(userTotals)
    .sort((a, b) => b.total_coins - a.total_coins)
    .slice(0, 10);

  return sortedSupporters;
} 