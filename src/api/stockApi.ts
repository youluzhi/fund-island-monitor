import type { StockQuote } from '@/types/stock'

/**
 * Electron 主进程拉东方财富 push2；无主进程时返回空数组。
 */
export async function fetchStockQuotes(codes: string[]): Promise<StockQuote[]> {
  const api = window.electronAPI
  if (api?.fetchStockQuotes) {
    return api.fetchStockQuotes(codes)
  }
  return []
}
