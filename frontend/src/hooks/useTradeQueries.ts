import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContextType';
import { getBaseUrl } from '../utils/config';
import { getSecureHeaders } from '../utils/security';
import type { Trade, DashboardStats } from '../types/trade';
import type { PropDashboardData, PropAccount } from '../types/account';

// Re-export types so consumers can import from one place
export type { Trade, DashboardStats } from '../types/trade';
export type { PropDashboardData, PropAccount } from '../types/account';

// ─── Single generic hook that powers every API call ───

function useApi<T>(key: readonly unknown[], endpoint: string, options?: { enabled?: boolean; fallback?: T }) {
    const { user } = useAuth();
    return useQuery<T>({
        queryKey: key,
        queryFn: async () => {
            const res = await fetch(`${getBaseUrl()}${endpoint}`, {
                headers: getSecureHeaders(user?.token),
            });
            if (!res.ok) return (options?.fallback ?? null) as T;
            return res.json();
        },
        enabled: (options?.enabled ?? true) && !!user,
    });
}

// ─── Typed hooks ───

export const useDashboardStats = (broker: string) =>
    useApi<DashboardStats>(['dashboardStats', broker], `/api/trades/dashboard?broker=${broker}`);

export const useTrades = (broker: string) =>
    useApi<Trade[]>(['trades', broker], `/api/trades?broker=${broker}`);

export const useAllTrades = () =>
    useApi<Trade[]>(['allTrades'], '/api/trades', { fallback: [] });

export const usePropAccounts = () =>
    useApi<PropAccount[]>(['propAccounts'], '/api/prop-account', { fallback: [] });

export const usePropDashboard = (accountId?: string, phase?: string) => {
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (phase) params.append('phase', phase);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    return useApi<PropDashboardData | null>(['propDashboard', accountId, phase], `/api/prop-account/dashboard${queryString}`, { fallback: null });
};

// ─── Cache invalidation helper ───

export const useInvalidateTrades = () => {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ['dashboardStats'] });
        qc.invalidateQueries({ queryKey: ['trades'] });
        qc.invalidateQueries({ queryKey: ['allTrades'] });
        qc.invalidateQueries({ queryKey: ['propDashboard'] });
        qc.invalidateQueries({ queryKey: ['propAccounts'] });
    };
};
