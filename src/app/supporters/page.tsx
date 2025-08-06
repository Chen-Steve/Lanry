import { createServerClient } from '@/lib/supabaseServer';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';

export const dynamic = 'force-dynamic'

interface TopSupporter {
  profile_id: string;
  username: string | null;
  avatar_url?: string;
  total_coins: number;
}

interface TransactionWithProfile {
  profile_id: string;
  amount: number;
  profiles: {
    username: string | null;
    avatar_url?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  };
}

async function getTopSupporters(): Promise<TopSupporter[]> {
  const supabase = await createServerClient();
  
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
        role
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

const SupporterCard = ({ supporter, index }: { supporter: TopSupporter; index: number }) => {
  const isTopThree = index < 3;
  const isFirst = index === 0;
  
  // Calculate avatar size based on position
  const avatarSize = isFirst ? 80 : isTopThree ? 64 : 48;
  
  return (
    <article
      className={`
        relative bg-container border-0 rounded-md overflow-hidden flex
        ${isFirst ? 'p-8' : isTopThree ? 'p-6' : 'p-4'}
      `}
    >
      {/* Background Overlay */}
      <span className="absolute inset-0 bg-container/90" />

      {/* Rank Badge */}
      <span className={`
        absolute right-0 top-0 z-10 flex items-center justify-center gap-0.5 px-2
        min-w-[3rem] h-9 rounded-bl-md
        ${isFirst ? 'bg-amber-500' : isTopThree ? 'bg-zinc-500' : 'bg-zinc-400'}
        [background-image:linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)]
        [background-size:16px_16px]
      `}>
        <Icon icon="tabler:number" className="w-5 h-5 text-white/90" />
        <span className="text-white font-medium">{index + 1}</span>
      </span>

      <main className="min-w-0 flex-1 relative z-10">
        <section className={`flex gap-4 ${isFirst ? 'flex-col items-center text-center' : 'items-center'}`}>
          {/* Avatar */}
          <Link 
            href={`/user-dashboard?userId=${supporter.profile_id}`}
            className="relative flex-shrink-0"
          >
            <Avatar
              src={supporter.avatar_url || null}
              username={supporter.username || 'Anonymous'}
              size={avatarSize}
              className="ring-2 ring-border hover:ring-primary transition-all"
            />
          </Link>

          {/* User Info */}
          <section className={`min-w-0 flex-1 ${isFirst ? 'w-full' : ''}`}>
            <header className={`flex items-center gap-2 mb-1 ${isFirst ? 'justify-center' : ''}`}>
              <h3 className={`min-w-0 flex-1 font-semibold text-foreground ${isFirst ? 'text-xl' : isTopThree ? 'text-lg' : 'text-base'}`}>
                <Link 
                  href={`/user-dashboard?userId=${supporter.profile_id}`}
                  className="hover:text-primary transition-colors block truncate"
                >
                  {supporter.username || 'Anonymous Supporter'}
                </Link>
              </h3>
            </header>
          </section>
        </section>
      </main>
    </article>
  );
};

export default async function SupportersPage() {
  const topSupporters = await getTopSupporters();

  return (
    <div className="container mx-auto px-4 py-2 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Icon 
            icon="ph:confetti-bold"
            className="text-3xl text-primary" 
          />
          <h1 className="text-3xl font-bold text-foreground">
            Top Supporters
          </h1>
          <Icon 
            icon="ph:confetti-bold" 
            className="text-3xl text-primary" 
          />
        </div>
        <p className="text-muted-foreground">
          Thank you to our amazing readers
        </p>
      </div>

      {/* Bento Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-8">
        {topSupporters.map((supporter: TopSupporter, index: number) => {
          let gridClass = '';
          
          if (index === 0) {
            // #1 - Large card (2x2 on desktop)
            gridClass = 'md:col-span-2 md:row-span-2';
          } else if (index === 1 || index === 2) {
            // #2 and #3 - Medium cards (2x1 on desktop)
            gridClass = 'md:col-span-2';
          } else {
            // #4-#10 - Small cards (1x1)
            gridClass = 'md:col-span-1';
          }

          return (
            <div key={supporter.profile_id} className={gridClass}>
              <SupporterCard supporter={supporter} index={index} />
            </div>
          );
        })}
      </div>

    </div>
  );
}
