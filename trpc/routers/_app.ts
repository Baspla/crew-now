import { router } from '../init';
import { reactionsRouter } from './reactions';

export const appRouter = router({
  reactions: reactionsRouter,
});

export type AppRouter = typeof appRouter;
