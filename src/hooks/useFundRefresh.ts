import { useEffect, useRef } from 'react'

import { fetchFundQuotes } from '@/api/fundApi'
import { fetchStockQuotes } from '@/api/stockApi'
import { useFundStore } from '@/store/fundStore'

const REFRESH_MS = 10_000

export function useFundRefresh() {
  const watchlistFundCodes = useFundStore((s) => s.watchlistFundCodes)
  const watchlistStockCodes = useFundStore((s) => s.watchlistStockCodes)
  const setQuotes = useFundStore((s) => s.setQuotes)
  const setStockQuotes = useFundStore((s) => s.setStockQuotes)
  const setRefreshing = useFundStore((s) => s.setRefreshing)
  const setError = useFundStore((s) => s.setError)

  const codesKey = `${watchlistFundCodes.join(',')}|${watchlistStockCodes.join(',')}`
  const fundsRef = useRef(watchlistFundCodes)
  const stocksRef = useRef(watchlistStockCodes)

  useEffect(() => {
    fundsRef.current = watchlistFundCodes
  }, [watchlistFundCodes])

  useEffect(() => {
    stocksRef.current = watchlistStockCodes
  }, [watchlistStockCodes])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined

    const run = async () => {
      const funds = fundsRef.current
      const stocks = stocksRef.current

      if (funds.length === 0 && stocks.length === 0) {
        setQuotes([])
        setStockQuotes([])
        setError(null)
        return
      }

      setRefreshing(true)
      setError(null)

      const errors: string[] = []

      const fundTask =
        funds.length > 0
          ? fetchFundQuotes(funds).catch((e: unknown) => {
              errors.push(e instanceof Error ? e.message : '基金刷新失败')
              return [] as Awaited<ReturnType<typeof fetchFundQuotes>>
            })
          : Promise.resolve([])

      const stockTask =
        stocks.length > 0
          ? fetchStockQuotes(stocks).catch((e: unknown) => {
              errors.push(e instanceof Error ? e.message : '股票刷新失败')
              return [] as Awaited<ReturnType<typeof fetchStockQuotes>>
            })
          : Promise.resolve([])

      try {
        const [fundData, stockData] = await Promise.all([fundTask, stockTask])
        if (!cancelled) {
          setQuotes(fundData)
          setStockQuotes(stockData)
          if (errors.length > 0) {
            setError(errors.join('；'))
          }
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false)
        }
      }
    }

    void run()
    timer = setInterval(() => {
      void run()
    }, REFRESH_MS)

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [codesKey, setError, setQuotes, setRefreshing, setStockQuotes])
}
