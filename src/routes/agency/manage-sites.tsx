import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/agency/manage-sites')({
  component: () => <Navigate to="/agency/manage-dump-points" />,
})
