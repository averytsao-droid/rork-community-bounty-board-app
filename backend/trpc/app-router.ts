import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { createBountyProcedure } from "./routes/bounties/create";
import { listBountiesProcedure } from "./routes/bounties/list";
import { myBountiesProcedure } from "./routes/bounties/my-bounties";
import { acceptBountyProcedure } from "./routes/bounties/accept";
import { acceptedBountiesProcedure } from "./routes/bounties/accepted";
import { cancelAcceptedBountyProcedure } from "./routes/bounties/cancel-accepted";
import { updateBountyStatusProcedure } from "./routes/bounties/update-status";
import { deleteBountyProcedure } from "./routes/bounties/delete";
import { completeBountyProcedure } from "./routes/bounties/complete";
import { listConversationsProcedure } from "./routes/conversations/list";
import { getMessagesProcedure } from "./routes/conversations/get-messages";
import { sendMessageProcedure } from "./routes/conversations/send-message";
import { createConversationProcedure } from "./routes/conversations/create";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  bounties: createTRPCRouter({
    create: createBountyProcedure,
    list: listBountiesProcedure,
    myBounties: myBountiesProcedure,
    accept: acceptBountyProcedure,
    accepted: acceptedBountiesProcedure,
    cancelAccepted: cancelAcceptedBountyProcedure,
    updateStatus: updateBountyStatusProcedure,
    delete: deleteBountyProcedure,
    complete: completeBountyProcedure,
  }),
  conversations: createTRPCRouter({
    list: listConversationsProcedure,
    getMessages: getMessagesProcedure,
    sendMessage: sendMessageProcedure,
    create: createConversationProcedure,
  }),
});

export type AppRouter = typeof appRouter;
