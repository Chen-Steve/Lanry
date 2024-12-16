import { useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

const updateReadingTime = async (minutes: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error: updateError } = await supabase.rpc('increment_reading_time', {
    user_id: user.id,
    minutes_to_add: minutes
  });

  if (updateError) {
    console.error('Error updating reading time:', updateError);
  }
};

export const useReadingTimeTracker = () => {
  useEffect(() => {
    let startTime = Date.now();
    let timeoutId: NodeJS.Timeout;

    // Update reading time every minute
    const trackReadingTime = () => {
      const elapsedMinutes = Math.floor((Date.now() - startTime) / (1000 * 60));
      if (elapsedMinutes >= 1) {
        updateReadingTime(elapsedMinutes);
        startTime = Date.now(); // Reset start time
      }
      timeoutId = setTimeout(trackReadingTime, 60 * 1000); // Check every minute
    };

    timeoutId = setTimeout(trackReadingTime, 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      // Save remaining time when component unmounts
      const finalMinutes = Math.floor((Date.now() - startTime) / (1000 * 60));
      if (finalMinutes >= 1) {
        updateReadingTime(finalMinutes);
      }
    };
  }, []);
}; 