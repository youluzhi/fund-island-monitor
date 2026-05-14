import { fetchFundQuotesMock } from '@/api/mockFundApi'
import type { FundQuote } from '@/types/fund'

/**
 * 在 Electron 内由主进程请求东方财富估值接口；无主进程时（纯浏览器）回退 Mock。
 */
export async function fetchFundQuotes(codes: string[]): Promise<FundQuote[]> {
  const api = window.electronAPI
  if (api?.fetchFundQuotes) {
    return api.fetchFundQuotes(codes)
  }
  return fetchFundQuotesMock(codes)
}
