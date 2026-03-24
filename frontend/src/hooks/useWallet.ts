'use client';

import useSWR from 'swr';
import { api } from '@/lib/apiClient';

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR('wallet-balance', () => api.getBalance(), {
    refreshInterval: 15000,
  });

  return {
    address: data?.address,
    ckbBalance: data?.ckbBalance ?? '0',
    ckbBalanceShannons: data?.ckbBalanceShannons ?? '0',
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useDAOCells() {
  const { data, error, isLoading, mutate } = useSWR('dao-cells', () => api.getDAOCells(), {
    refreshInterval: 20000,
  });

  return {
    cells: data?.cells ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useEpochInfo() {
  const { data, isLoading } = useSWR('epoch-info', () => api.getEpochInfo(), {
    refreshInterval: 30000,
  });

  return { epochInfo: data, isLoading };
}
