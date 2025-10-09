import { router } from '../init';
import { reactionsRouter } from './reactions';
import { commentsRouter } from './comments';

export const appRouter = router({
  reactions: reactionsRouter,
  comments: commentsRouter,
});

export type AppRouter = typeof appRouter;
