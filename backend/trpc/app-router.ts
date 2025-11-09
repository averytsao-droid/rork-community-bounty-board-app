import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { createBountyProcedure } from "./routes/bounties/create";
import { listBountiesProcedure } from "./routes/bounties/list";
import { myBountiesProcedure } from "./routes/bounties/my-bounties";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  bounties: createTRPCRouter({
    create: createBountyProcedure,
    list: listBountiesProcedure,
    myBounties: myBountiesProcedure,
  }),
});

export type AppRouter = typeof appRouter;
