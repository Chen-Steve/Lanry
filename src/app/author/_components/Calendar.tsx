'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  advancedDates?: { date: Date; chapterNumber: number }[]; // Array of dates that have advanced chapters with their chapter numbers
  minDate?: Date; // Minimum selectable date
}

const Calendar = ({ onDateSelect, advancedDates = [], minDate = new Date() }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get the first day of the month and the number of days in the month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Helper function to check if a date has advanced chapters and get their chapter numbers
  const getAdvancedDateInfo = (date: Date) => {
    const advancedOnDate = advancedDates
      .filter(adv => {
        if (!adv?.date) return false;
        return adv.date.getDate() === date.getDate() &&
               adv.date.getMonth() === date.getMonth() &&
               adv.date.getFullYear() === date.getFullYear();
      })
      .map(adv => adv.chapterNumber);

    return {
      hasAdvanced: advancedOnDate.length > 0,
      chapterNumbers: advancedOnDate
    };
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 w-12 border-t border-border" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const { hasAdvanced, chapterNumbers } = getAdvancedDateInfo(date);
      const isPastDate = date < new Date(minDate.setHours(0, 0, 0, 0));
      
      days.push(
        <button
          key={day}
          onClick={() => !isPastDate && onDateSelect?.(date)}
          disabled={isPastDate}
          className={`group h-12 w-12 text-base hover:bg-accent transition-colors border-t border-border flex items-center justify-center relative
            ${isToday ? 'bg-primary/10 font-semibold text-primary' : ''}
            ${hasAdvanced ? 'text-orange-500 font-medium' : ''}
            ${isPastDate ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
        >
          {day}
          {hasAdvanced && (
            <>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500" />
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-normal bg-background border border-border rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity">
                <div className="flex flex-col gap-0.5">
                  {chapterNumbers.map((chapterNumber) => (
                    <div key={chapterNumber}>Advanced Chapter {chapterNumber}</div>
                  ))}
                </div>
              </div>
            </>
          )}
        </button>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPreviousMonth();
            }}
            className="p-2 hover:bg-accent rounded-full transition-colors"
            aria-label="Previous month"
          >
            <Icon icon="mdi:chevron-left" className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNextMonth();
            }}
            className="p-2 hover:bg-accent rounded-full transition-colors"
            aria-label="Next month"
          >
            <Icon icon="mdi:chevron-right" className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 place-items-center gap-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="h-8 w-12 flex items-center justify-center text-sm text-muted-foreground">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[336px] mx-auto bg-background rounded-lg p-3">
      {generateCalendarDays()}
    </div>
  );
};

export default Calendar; 