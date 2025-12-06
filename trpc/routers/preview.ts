import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { calculateHashTime, getDateParts } from '@/lib/time';

export const previewRouter = router({
  getHashTime: protectedProcedure
    .input(z.object({ date: z.number() }))
    .query(async ({ input }) => {
      const date = new Date(input.date);
      const TZ = 'Europe/Berlin';
      
      // Normalize to noon to ensure we get the correct day parts consistently
      date.setHours(12, 0, 0, 0);

      const { startOfDay, endOfDay } = getDateParts(date, TZ);
      const hashTime = calculateHashTime(date, TZ, startOfDay, endOfDay);
      
      return {
        hashTime,
        date: date.getTime(),
        startOfDay: startOfDay.getTime(),
        endOfDay: endOfDay.getTime(),
      };
    }),
});
