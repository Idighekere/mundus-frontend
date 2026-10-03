import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { routeTree } from './routeTree.gen'
import { SessionProvider } from '@/lib/session'
import { ContractorSessionProvider } from '@/lib/contractor-session'

const router = createRouter({ routeTree })

// Shared cache: pages remount on every visit, so fresh mounts read cache
// instead of flashing skeletons. Mutations invalidate their key families.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ContractorSessionProvider>
          <RouterProvider router={router} />
        </ContractorSessionProvider>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
