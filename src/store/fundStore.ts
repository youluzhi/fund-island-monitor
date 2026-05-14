import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { FundQuote } from '@/types/fund'
import type { StockQuote } from '@/types/stock'

export type FundStore = {
  watchlistFundCodes: string[]
  watchlistStockCodes: string[]
  quotes: FundQuote[]
  stockQuotes: StockQuote[]
  isRefreshing: boolean
  lastError: string | null
  setWatchlistFundCodes: (codes: string[]) => void
  setWatchlistStockCodes: (codes: string[]) => void
  setQuotes: (quotes: FundQuote[]) => void
  setStockQuotes: (quotes: StockQuote[]) => void
  setRefreshing: (value: boolean) => void
  setError: (message: string | null) => void
}

const DEFAULT_FUND_CODES = ['110025', '026623', '025333', '025701']

type PersistedV1 = {
  watchlistCodes?: string[]
  watchlistFundCodes?: string[]
  watchlistStockCodes?: string[]
}

export const useFundStore = create<FundStore>()(
  persist(
    (set) => ({
      watchlistFundCodes: DEFAULT_FUND_CODES,
      watchlistStockCodes: [],
      quotes: [],
      stockQuotes: [],
      isRefreshing: false,
      lastError: null,
      setWatchlistFundCodes: (codes) =>
        set(() => ({
          watchlistFundCodes: Array.from(new Set(codes.map((c) => c.trim()).filter(Boolean))),
        })),
      setWatchlistStockCodes: (codes) =>
        set(() => ({
          watchlistStockCodes: Array.from(new Set(codes.map((c) => c.trim()).filter(Boolean))),
        })),
      setQuotes: (quotes) => set(() => ({ quotes })),
      setStockQuotes: (stockQuotes) => set(() => ({ stockQuotes })),
      setRefreshing: (isRefreshing) => set(() => ({ isRefreshing })),
      setError: (lastError) => set(() => ({ lastError })),
    }),
    {
      name: 'fund-island-watchlist',
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const p = persistedState as PersistedV1
          if (Array.isArray(p.watchlistCodes) && !p.watchlistFundCodes) {
            return {
              watchlistFundCodes: [...p.watchlistCodes],
              watchlistStockCodes: [],
            }
          }
        }
        return persistedState as object
      },
      partialize: (state) => ({
        watchlistFundCodes: state.watchlistFundCodes,
        watchlistStockCodes: state.watchlistStockCodes,
      }),
    },
  ),
)
