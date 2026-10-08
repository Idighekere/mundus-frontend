import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contractorsApi,
  dashboardApi,
  dumpPointsApi,
  payoutsApi,
  reportersApi,
  staffApi,
} from './api'
import { fetchLiveSiteDetail } from './live-timeline'

/** One combined query per screen — a single loading/error state each. */
export const qk = {
  dashboard: ['dashboard'],
  contractors: ['contractors'],
  dumpPoints: ['dump-points'],
  reporters: ['reporters'],
  staff: ['staff'],
  field: ['field'],
  history: ['history'],
  siteDetail: (id: string | number) => ['site', String(id)],
  notices: ['notices'],
  searchIndex: ['search-index'],
  payouts: (period?: string, status?: string) => ['payouts', period ?? 'all', status ?? 'all'],
  payoutDetail: (id: string) => ['payout', id],
  held: (period?: string) => ['held', period ?? 'all'],
  earnings: (period?: string) => ['earnings', period ?? 'current'],
  myPayouts: ['my-payouts'],
} as const

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => {
      const [sites, stats, contractors] = await Promise.all([
        dashboardApi.sites(),
        dashboardApi.stats(),
        contractorsApi.list(),
      ])
      return { sites: sites.sites, stats, contractors }
    },
  })
}

export function useContractorsPage() {
  return useQuery({
    queryKey: qk.contractors,
    queryFn: async () => {
      const [contractors, sites] = await Promise.all([contractorsApi.list(), dumpPointsApi.all()])
      return { contractors, sites }
    },
  })
}

export function useDumpPointsPage() {
  return useQuery({
    queryKey: qk.dumpPoints,
    queryFn: async () => {
      const [sites, contractors] = await Promise.all([dumpPointsApi.all(), contractorsApi.list()])
      return { sites, contractors }
    },
  })
}

export function useReportersPage() {
  return useQuery({
    queryKey: qk.reporters,
    queryFn: async () => {
      const [reporters, contractors, sites] = await Promise.all([
        reportersApi.list(),
        contractorsApi.list(),
        dumpPointsApi.all(),
      ])
      return { reporters, contractors, sites }
    },
  })
}

export function useStaffList() {
  return useQuery({
    queryKey: qk.staff,
    queryFn: () => staffApi.list(),
  })
}

export function useField() {
  return useQuery({
    queryKey: qk.field,
    queryFn: async () => {
      const [sites, alerts] = await Promise.all([contractorsApi.sites(), contractorsApi.alerts()])
      return { sites, alerts }
    },
  })
}

export function useHistory() {
  return useQuery({
    queryKey: qk.history,
    queryFn: async () => {
      const [pairs, sites] = await Promise.all([contractorsApi.submissions(), contractorsApi.sites()])
      return { pairs, sites }
    },
  })
}

export function useSiteDetail(siteId: string) {
  return useQuery({
    queryKey: qk.siteDetail(siteId),
    queryFn: () => fetchLiveSiteDetail(siteId),
  })
}

export function useNoticesData() {
  return useQuery({
    queryKey: qk.notices,
    queryFn: async () => {
      const [reporters, sites, contractors] = await Promise.all([
        reportersApi.list(),
        dashboardApi.sites(),
        contractorsApi.list(),
      ])
      return { reporters, sites: sites.sites, contractors }
    },
  })
}

export function useSearchIndex() {
  return useQuery({
    queryKey: qk.searchIndex,
    queryFn: async () => {
      const [sites, contractors] = await Promise.all([dashboardApi.sites(), contractorsApi.list()])
      return { sites: sites.sites, contractors }
    },
  })
}

/** Invalidate key families after a mutation so lists refresh once. */
export function useInvalidate() {
  const qc = useQueryClient()
  return (...keys: readonly (readonly string[])[]) =>
    Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })))
}

export function usePayoutsPage(period?: string, status?: string) {
  return useQuery({
    queryKey: qk.payouts(period, status),
    queryFn: () => payoutsApi.list(period, status),
  })
}

export function usePayoutDetail(id: string) {
  return useQuery({
    queryKey: qk.payoutDetail(id),
    queryFn: () => payoutsApi.detail(id),
  })
}

export function useHeldQueue(period?: string) {
  return useQuery({
    queryKey: qk.held(period),
    queryFn: () => payoutsApi.held(period),
  })
}

export function useMyEarnings(period?: string) {
  return useQuery({
    queryKey: qk.earnings(period),
    queryFn: () => payoutsApi.myEarnings(period),
  })
}

export function useMyPayouts() {
  return useQuery({
    queryKey: qk.myPayouts,
    queryFn: () => payoutsApi.myPayouts(),
  })
}

/** Platform balance for payouts. Absent (404) until the backend ships it —
callers render nothing on error instead of failing the page. */
export function useAgencyWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => payoutsApi.wallet(),
    retry: false,
    staleTime: 60_000,
  })
}

export function useWalletTopups() {
  return useQuery({
    queryKey: ['wallet-topups'],
    queryFn: () => payoutsApi.topups(),
    retry: false,
  })
}
