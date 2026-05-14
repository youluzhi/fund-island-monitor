import type { FundQuote } from '@/types/fund'
import type { StockQuote } from '@/types/stock'

declare global {
  interface Window {
    electronAPI?: {
      setWindowBounds: (payload: { width: number; height: number }) => Promise<void>
      getPlatform: () => Promise<string>
      fetchFundQuotes: (codes: string[]) => Promise<FundQuote[]>
      fetchStockQuotes: (codes: string[]) => Promise<StockQuote[]>
    }
  }
}

export {}
