"use client";

import { Icon } from "@iconify/react";
import { Novel } from "@/types/database";

interface NovelCardProps {
  novel: Novel;
  onEdit?: (novel: Novel) => void;
  onDelete?: (novel: Novel) => void;
}

export default function NovelCard({ novel, onEdit, onDelete }: NovelCardProps) {
  const getStatusIcon = (status: Novel['status']) => {
    switch (status) {
      case 'ONGOING': return 'ph:pencil';
      case 'COMPLETED': return 'ph:check-circle';
      case 'HIATUS': return 'ph:pause-circle';
      case 'DROPPED': return 'ph:x-circle';
      case 'DRAFT': return 'ph:file-text';
      default: return 'ph:book';
    }
  };

  const getStatusColor = (status: Novel['status']) => {
    switch (status) {
      case 'ONGOING': return 'text-blue-500';
      case 'COMPLETED': return 'text-green-500';
      case 'HIATUS': return 'text-yellow-500';
      case 'DROPPED': return 'text-red-500';
      case 'DRAFT': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="flex">
        {/* Cover Image */}
        <div className="relative w-16 sm:w-20 flex-shrink-0 overflow-hidden self-stretch">
          {novel.coverImageUrl ? (
            <img
              src={novel.coverImageUrl}
              alt={novel.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Icon icon="ph:book" className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {/* Delete Button on Cover */}
          {onDelete && (
            <button
              onClick={() => onDelete(novel)}
              className="absolute top-0 left-0 p-1 bg-red-600 text-white hover:bg-red-700 rounded-br-lg"
              title="Delete Novel"
            >
              <Icon icon="ph:trash" className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between min-h-[96px] sm:min-h-[108px]">
          <div className="flex-1 pt-2 sm:pt-3 px-2 sm:px-3">
            {/* Header with Status badges */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                {/* Title and Author */}
                <h3 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-2 leading-tight">
                  {novel.title}
                </h3>
                {novel.author && (
                  <p className="text-xs text-muted-foreground mb-1">
                    by {novel.author}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-1 ml-2">
                {/* Status Badge */}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(novel.status)} bg-muted/50`}>
                  <Icon icon={getStatusIcon(novel.status)} className="h-2.5 w-2.5" />
                  <span className="text-xs">{novel.status}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2 mt-1 mb-1 justify-end">
                {onEdit && (
                  <button
                    onClick={() => onEdit(novel)}
                    className="text-xs text-primary border border-border rounded px-2 py-0.5 hover:bg-accent"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer: Created */}
          <div className="flex items-center justify-end text-xs text-muted-foreground border-t border-border/50 px-2 sm:px-3 py-1">
            <span className="text-xs">
              {formatDate(novel.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 