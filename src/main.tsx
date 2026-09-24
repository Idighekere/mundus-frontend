import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'
import { SessionProvider } from '@/lib/session'
import { ContractorSessionProvider } from '@/lib/contractor-session'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <ContractorSessionProvider>
        <RouterProvider router={router} />
      </ContractorSessionProvider>
    </SessionProvider>
  </StrictMode>,
)
