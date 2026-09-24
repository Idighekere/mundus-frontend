import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/contractor/')({
  component: () => <Navigate to="/contractor/sites" />,
})
