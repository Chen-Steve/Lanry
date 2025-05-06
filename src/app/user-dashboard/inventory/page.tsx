'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function InventoryPage() {
  // Placeholder for inventory items
  const [activeTab, setActiveTab] = useState<'profile' | 'themes' | 'badges'>('profile');
  
  // Coming soon overlay
  const comingSoon = true;
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/user-dashboard"
          className="hover:opacity-80 transition-opacity"
        >
          <Icon icon="ph:arrow-left-bold" className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Inventory</h1>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`tab-button px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          data-state={activeTab === 'profile' ? 'active' : 'inactive'}
        >
          Profile Borders
          <div className="tab-indicator" />
        </button>
        <button
          onClick={() => setActiveTab('themes')}
          className={`tab-button px-4 py-2 font-medium transition-colors ${
            activeTab === 'themes' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          data-state={activeTab === 'themes' ? 'active' : 'inactive'}
        >
          Themes
          <div className="tab-indicator" />
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`tab-button px-4 py-2 font-medium transition-colors ${
            activeTab === 'badges' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          data-state={activeTab === 'badges' ? 'active' : 'inactive'}
        >
          Badges
          <div className="tab-indicator" />
        </button>
      </div>
      
      {/* Content area */}
      <div className="space-y-8 relative">
        {comingSoon && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3">
            <div className="bg-primary/10 rounded-full p-3">
              <Icon icon="ph:sparkle-fill" className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Season Pass Coming Soon</h3>
          </div>
        )}
        
        {/* Profile Customization Items */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="ph:user-circle-fill" className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Profile Frame {item}</h3>
                  <p className="text-sm text-muted-foreground">Common</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Themes */}
        {activeTab === 'themes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="ph:paint-brush-fill" className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Custom Theme {item}</h3>
                  <p className="text-sm text-muted-foreground">Rare</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Badges */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="ph:medal-fill" className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Achievement Badge {item}</h3>
                  <p className="text-sm text-muted-foreground">Epic</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 