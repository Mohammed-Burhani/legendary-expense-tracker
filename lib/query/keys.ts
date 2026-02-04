export const queryKeys = {
  users: {
    all: ['users'] as const,
    managers: ['users', 'managers'] as const,
    laborers: (siteId?: string) => ['users', 'laborers', siteId] as const,
  },
  sites: {
    all: ['sites'] as const,
    byId: (id: string) => ['sites', id] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    byManager: (managerId: string) => ['expenses', 'manager', managerId] as const,
    bySite: (siteId: string) => ['expenses', 'site', siteId] as const,
    today: (managerId?: string) => ['expenses', 'today', managerId] as const,
  },
  carryforwards: {
    all: ['carryforwards'] as const,
    pending: (siteId?: string, date?: string) => ['carryforwards', 'pending', siteId, date] as const,
    history: (siteId?: string, startDate?: string, endDate?: string) => 
      ['carryforwards', 'history', siteId, startDate, endDate] as const,
  },
} as const;
