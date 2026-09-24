import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/agency/manage-dump-points')({
  component: () => <Navigate to="/agency/dump-points" />,
})
