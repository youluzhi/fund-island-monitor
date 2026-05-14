import { contextBridge, ipcRenderer } from 'electron'

import type { FundQuotePayload } from './eastmoneyFund'
import type { StockQuotePayload } from './eastmoneyStock'

export type WindowBoundsPayload = {
  width: number
  height: number
}

contextBridge.exposeInMainWorld('electronAPI', {
  setWindowBounds: (payload: WindowBoundsPayload) =>
    ipcRenderer.invoke('window:set-bounds', payload) as Promise<void>,
  getPlatform: () => ipcRenderer.invoke('app:get-platform') as Promise<string>,
  fetchFundQuotes: (codes: string[]) =>
    ipcRenderer.invoke('fund:fetch-quotes', codes) as Promise<FundQuotePayload[]>,
  fetchStockQuotes: (codes: string[]) =>
    ipcRenderer.invoke('stock:fetch-quotes', codes) as Promise<StockQuotePayload[]>,
})
