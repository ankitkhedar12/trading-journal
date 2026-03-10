import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getBaseUrl } from '../utils/config';

// ─── Single generic hook that powers every API call ───
function useApi<T = any>(key: readonly unknown[], endpoint: string, options?: { enabled?: boolean; fallback?: T }) {
    const { user } = useAuth();
    return useQuery<T>({
        queryKey: key,
        queryFn: async () => {
            const res = await fetch(`${getBaseUrl()}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` },
            });
            if (!res.ok) return (options?.fallback ?? null) as T;
            return res.json();
        },
        enabled: (options?.enabled ?? true) && !!user,
    });
}

// ─── Thin wrappers: just a key + endpoint ───
export const useDashboardStats = (broker: string) =>
    useApi(['dashboardStats', broker], `/api/trades/dashboard?broker=${broker}`);

export const useTrades = (broker: string) =>
    useApi(['trades', broker], `/api/trades?broker=${broker}`);

export const useAllTrades = <T = any>() =>
    useApi<T[]>(['allTrades'], '/api/trades', { fallback: [] as unknown as T[] });

export const usePropDashboard = () =>
    useApi(['propDashboard'], '/api/prop-account/dashboard', { fallback: null });

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
