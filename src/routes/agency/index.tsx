import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/agency/')({
  component: () => <Navigate to="/agency/dashboard" />,
})
