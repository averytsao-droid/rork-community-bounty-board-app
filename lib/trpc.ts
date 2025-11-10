import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  console.log('🔧 tRPC Configuration:');
  console.log('  Base URL:', baseUrl || '❌ MISSING');
  console.log('  Full tRPC URL:', baseUrl ? `${baseUrl}/api/trpc` : '❌ NOT SET');
  
  if (!baseUrl) {
    throw new Error(
      "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL in your env file"
    );
  }
  
  return baseUrl;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('🌐 tRPC Request:', url);
        try {
          const response = await fetch(url, options);
          console.log('✅ tRPC Response:', response.status, response.statusText);
          return response;
        } catch (error: any) {
          console.error('❌ tRPC Fetch Error:', error.message);
          throw error;
        }
      },
    }),
  ],
});
