import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContextType';
import { getBaseUrl } from '../utils/config';
import { getSecureHeaders } from '../utils/security';
import type { Trade, DashboardStats, PropDashboardData } from '../types/trade';

// Re-export types so consumers can import from one place
export type { Trade, DashboardStats, PropDashboardData } from '../types/trade';

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

export const usePropDashboard = () =>
    useApi<PropDashboardData | null>(['propDashboard'], '/api/prop-account/dashboard', { fallback: null });

// ─── Cache invalidation helper ───

export const useInvalidateTrades = () => {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ['dashboardStats'] });
        qc.invalidateQueries({ queryKey: ['trades'] });
        qc.invalidateQueries({ queryKey: ['allTrades'] });
        qc.invalidateQueries({ queryKey: ['propDashboard'] });
    };
};
