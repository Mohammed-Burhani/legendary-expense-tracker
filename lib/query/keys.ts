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
} as const;
