import { getTopSupporters, TopSupporter } from './actions';
import { SupporterCard } from './components/SupporterCard';
import { Icon } from '@iconify/react';

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
