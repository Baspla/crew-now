import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { auth } from '@/auth';

export const createTRPCContext = async () => {
  const session = await auth();
  return { session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next();
});
