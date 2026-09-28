import { createClient, TRPCProvider } from "@kitchen-manager/api-client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { getApiHeaders } from "./auth-client"

// tRPC + TanStack Query context for the mobile app. Mobile authenticates via
// the session cookie (there's no cookie jar on native — expo() plugin stores
// it in SecureStore), so the client sends it as a header via `getApiHeaders`.
// Instances are created with useState so the browser dev cycle / fast refresh
// doesn't churn them.
export function ApiProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    createClient({
      url: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"}/api/trpc`,
      headers: getApiHeaders,
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
