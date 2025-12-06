import { router } from '../init';
import { reactionsRouter } from './reactions';
import { commentsRouter } from './comments';
import { settingsRouter } from './settings';
import { postsRouter } from './posts';
import { userReactionsRouter } from './userReactions';
import { previewRouter } from './preview';

export const appRouter = router({
  reactions: reactionsRouter,
  comments: commentsRouter,
  settings: settingsRouter,
  userReactions: userReactionsRouter,
  posts: postsRouter,
  preview: previewRouter,
});

export type AppRouter = typeof appRouter;
