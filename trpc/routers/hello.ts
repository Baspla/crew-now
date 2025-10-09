import { publicProcedure, router } from '../init';
import { z } from 'zod';

export const helloRouter = router({
  greeting: publicProcedure
    .input(z.object({ text: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const name = input?.text ?? 'world';
      return { greeting: `Hello, ${name}!` };
    }),
});
