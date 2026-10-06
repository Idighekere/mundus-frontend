import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WatchupErrorBoundary, WatchupProvider } from '@watchupltd/react'
import './index.css'
import { routeTree } from './routeTree.gen'
import { SessionProvider } from '@/lib/session'
import { ContractorSessionProvider } from '@/lib/contractor-session'
import { Identify } from '@/components/identify'
import { ErrorPage } from '@/components/error-page'

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
    <WatchupProvider
      apiKey={import.meta.env.VITE_WATCHUP_API_KEY as string | undefined}
      options={{ environment: import.meta.env.MODE, release: 'mundus@1.0.0' }}
    >
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ContractorSessionProvider>
            <Identify />
            <WatchupErrorBoundary
              fallback={(error, reset) => (
                <ErrorPage
                  onReset={reset}
                  title="Something went wrong"
                  message={error.message || 'This screen ran into a problem. Your data is safe.'}
                />
              )}
            >
              <RouterProvider router={router} />
            </WatchupErrorBoundary>
          </ContractorSessionProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WatchupProvider>
  </StrictMode>,
)
