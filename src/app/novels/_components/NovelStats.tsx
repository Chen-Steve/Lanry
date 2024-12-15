'use client';

import { Icon } from '@iconify/react';

interface NovelStatsProps {
  totalChapters: number;
}

const NovelStats = ({ totalChapters }: NovelStatsProps) => (
  <div className="flex items-center gap-1 text-xs text-gray-600">
    <Icon icon="pepicons-print:book" className="text-sm" />
    <span>{totalChapters} Ch.</span>
  </div>
);

export default NovelStats; 