import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getAuth } from "../lib/firebaseAdmin";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }

  return {
    req: opts.req,
    userId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use((opts) => {
  if (!opts.ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      userId: opts.ctx.userId,
    },
  });
});
