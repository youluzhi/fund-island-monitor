import { motion } from 'framer-motion'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { FundRow } from '@/components/FundRow'
import { StockRow } from '@/components/StockRow'
import { useIslandWindowBounds } from '@/hooks/useIslandWindowBounds'
import { useFundStore } from '@/store/fundStore'
import { formatPercent, formatSignedNumber } from '@/utils/formatNumber'

const COLLAPSED_WIDTH = 240
const COLLAPSED_HEIGHT = 36
const EXPANDED_WIDTH = 420

const WINDOW_FILL_CLASS = 'bg-[rgba(28,28,28,0.45)]'

const ISLAND_CHROME_CLASS =
  'relative overflow-hidden rounded-[999px] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-black/20'

const HOVER_LEAVE_MS = 420

const ISLAND_EASE = [0.22, 1, 0.36, 1] as const
const ISLAND_EXPAND_S = 0.52
const ISLAND_COLLAPSE_S = 0.68

const COLLAPSE_WINDOW_DELAY_MS = Math.round((ISLAND_COLLAPSE_S + 0.06) * 1000) + 100

const FUND_ROW = 56
const STOCK_ROW = 76
const LIST_GAP = 8
const SECTION_LABEL = 20
const SECTION_GAP = 10
/** 与列表区域 max-h 一致，避免「外层很高、列表只滚一截」底部留空 */
const MAX_LIST_VIEWPORT = 240

function naturalListBodyHeight(fundCount: number, stockCount: number) {
  let body = 0
  if (fundCount > 0) {
    body += SECTION_LABEL + fundCount * FUND_ROW + Math.max(fundCount - 1, 0) * LIST_GAP
  }
  if (stockCount > 0) {
    if (fundCount > 0) body += SECTION_GAP
    body += SECTION_LABEL + stockCount * STOCK_ROW + Math.max(stockCount - 1, 0) * LIST_GAP
  }
  if (fundCount === 0 && stockCount === 0) {
    body = 56
  }
  return body
}

function computeExpandedHeight(fundCount: number, stockCount: number, settingsOpen: boolean) {
  const outerPadding = 12
  const header = 40

  if (settingsOpen) {
    const settingsBlock = 300
    return Math.min(outerPadding * 2 + header + settingsBlock, 460)
  }

  const footer = 20
  const natural = naturalListBodyHeight(fundCount, stockCount)
  const listViewport = Math.min(natural, MAX_LIST_VIEWPORT)
  const raw = outerPadding * 2 + header + listViewport + footer
  return Math.min(Math.round(raw), 420)
}

type Headline =
  | { kind: 'empty' }
  | { kind: 'fund'; title: string; subtitle: string; up: boolean }
  | { kind: 'stock'; title: string; subtitle: string; up: boolean }

export function FundIsland() {
  const [pointerInside, setPointerInside] = useState(false)
  const [shellExpanded, setShellExpanded] = useState(false)
  const [fundCodesInput, setFundCodesInput] = useState('')
  const [stockCodesInput, setStockCodesInput] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const quotes = useFundStore((s) => s.quotes)
  const stockQuotes = useFundStore((s) => s.stockQuotes)
  const isRefreshing = useFundStore((s) => s.isRefreshing)
  const lastError = useFundStore((s) => s.lastError)
  const watchlistFundCodes = useFundStore((s) => s.watchlistFundCodes)
  const watchlistStockCodes = useFundStore((s) => s.watchlistStockCodes)
  const setWatchlistFundCodes = useFundStore((s) => s.setWatchlistFundCodes)
  const setWatchlistStockCodes = useFundStore((s) => s.setWatchlistStockCodes)

  const detailOpen = pointerInside || settingsOpen

  const headline: Headline = useMemo(() => {
    if (quotes.length > 0) {
      const lead = quotes[0]
      const up = lead.changeAmount >= 0
      return {
        kind: 'fund',
        title: lead.name,
        subtitle: `${formatSignedNumber(lead.changeAmount, 4)} · ${formatPercent(lead.changePercent)}`,
        up,
      }
    }
    if (stockQuotes.length > 0) {
      const s = stockQuotes[0]
      const up = s.changeAmount >= 0
      return {
        kind: 'stock',
        title: s.name,
        subtitle: `${formatSignedNumber(s.changeAmount, 3)} · ${formatPercent(s.changePercent)}`,
        up,
      }
    }
    return { kind: 'empty' }
  }, [quotes, stockQuotes])

  const expandedHeight = useMemo(
    () => computeExpandedHeight(quotes.length, stockQuotes.length, settingsOpen),
    [quotes.length, settingsOpen, stockQuotes.length],
  )

  const islandWidth = shellExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
  const islandHeight = detailOpen ? expandedHeight : COLLAPSED_HEIGHT

  useIslandWindowBounds({
    width: islandWidth,
    height: islandHeight,
    collapseWindowDelayMs: COLLAPSE_WINDOW_DELAY_MS,
  })

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = undefined
    }
  }, [])

  const handleEnter = useCallback(() => {
    clearLeaveTimer()
    setPointerInside(true)
    setShellExpanded(true)
  }, [clearLeaveTimer])

  const handleLeave = useCallback(() => {
    clearLeaveTimer()
    setPointerInside(false)
    setSettingsOpen(false)
    leaveTimerRef.current = setTimeout(() => {
      setShellExpanded(false)
    }, HOVER_LEAVE_MS)
  }, [clearLeaveTimer])

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer])

  const openSettings = () => {
    setFundCodesInput(watchlistFundCodes.join(', '))
    setStockCodesInput(watchlistStockCodes.join(', '))
    setSettingsOpen(true)
  }

  const applyCodes = () => {
    const parse = (raw: string) =>
      raw
        .split(/[,，\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    setWatchlistFundCodes(parse(fundCodesInput))
    setWatchlistStockCodes(parse(stockCodesInput))
    setSettingsOpen(false)
  }

  const hasAnyList = quotes.length > 0 || stockQuotes.length > 0

  return (
    <div
      className={`flex h-full w-full items-start justify-center overflow-hidden rounded-[18px] ${WINDOW_FILL_CLASS}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <motion.div
        className={ISLAND_CHROME_CLASS}
        initial={false}
        animate={{
          width: islandWidth,
          height: islandHeight,
          borderRadius: detailOpen ? 26 : 999,
        }}
        transition={{
          width: {
            type: 'tween',
            duration: shellExpanded ? ISLAND_EXPAND_S : ISLAND_COLLAPSE_S,
            ease: ISLAND_EASE,
          },
          height: {
            type: 'tween',
            duration: detailOpen ? ISLAND_EXPAND_S : 0.12,
            ease: ISLAND_EASE,
          },
          borderRadius: {
            type: 'tween',
            duration: detailOpen ? ISLAND_EXPAND_S * 0.92 : 0.16,
            ease: ISLAND_EASE,
          },
        }}
      >
        <div
          className={
            detailOpen
              ? 'relative flex min-h-0 flex-col gap-2 px-3 py-3'
              : 'relative flex h-full flex-col px-3'
          }
        >
          {detailOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: ISLAND_EASE }}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-white/90">自选 · 基金 / A 股</div>
                <div className="text-[11px] text-white/45">每 10 秒刷新 · 东方财富</div>
              </div>
              <div className="flex items-center gap-2">
                {isRefreshing ? <Loader2 className="size-3.5 animate-spin text-white/45" /> : null}
                <button
                  type="button"
                  onClick={() => (settingsOpen ? setSettingsOpen(false) : openSettings())}
                  className="inline-flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/15"
                  aria-label="自选设置"
                >
                  <SlidersHorizontal className="size-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
                <div className="min-w-0 leading-none">
                  {headline.kind === 'empty' ? (
                    <>
                      <div className="truncate text-[12px] font-semibold text-white/90">自选行情</div>
                      <div className="truncate text-[11px] text-white/45">悬停查看列表</div>
                    </>
                  ) : (
                    <>
                      <div className="truncate text-[12px] font-semibold text-white/90">{headline.title}</div>
                      <div
                        className={`truncate text-[11px] tabular-nums ${
                          headline.up ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {headline.subtitle}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {isRefreshing ? <Loader2 className="size-3.5 shrink-0 animate-spin text-white/45" /> : null}
            </div>
          )}

          {detailOpen ? (
            <motion.div
              key="island-detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: ISLAND_EASE }}
              className="pointer-events-auto flex shrink-0 flex-col gap-2"
            >
              {settingsOpen ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: ISLAND_EASE }}
                  className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                >
                  <div>
                    <label className="text-[11px] text-white/55" htmlFor="fund-codes">
                      基金代码（6 位，逗号或空格分隔）
                    </label>
                    <textarea
                      id="fund-codes"
                      value={fundCodesInput}
                      onChange={(event) => setFundCodesInput(event.target.value)}
                      rows={2}
                      className="mt-1 w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-[12px] text-white/90 outline-none ring-1 ring-white/15 placeholder:text-white/35 focus:ring-2 focus:ring-emerald-400/60"
                      placeholder="例如：110025,161725"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/55" htmlFor="stock-codes">
                      A 股代码（6 位沪深，逗号或空格分隔）
                    </label>
                    <textarea
                      id="stock-codes"
                      value={stockCodesInput}
                      onChange={(event) => setStockCodesInput(event.target.value)}
                      rows={2}
                      className="mt-1 w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-[12px] text-white/90 outline-none ring-1 ring-white/15 placeholder:text-white/35 focus:ring-2 focus:ring-sky-400/50"
                      placeholder="例如：600519,000001,300750"
                    />
                  </div>
                  <p className="text-[10px] leading-snug text-white/35">
                    股票数据来自东方财富 push2 快照（换手 f168、量 f47 手、额 f48 元）。北交所 / 特殊代码可能无法识别。
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className="rounded-full px-3 py-1.5 text-[12px] text-white/70 hover:bg-white/10"
                      onClick={() => setSettingsOpen(false)}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-emerald-400/90 px-3 py-1.5 text-[12px] font-semibold text-emerald-950 hover:bg-emerald-300"
                      onClick={applyCodes}
                    >
                      保存
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
                  {lastError ? (
                    <div className="rounded-2xl bg-rose-500/15 px-3 py-2 text-[12px] text-rose-100 ring-1 ring-rose-400/30">
                      {lastError}
                    </div>
                  ) : null}
                  <div className="mt-1 flex max-h-[240px] flex-col gap-2 overflow-y-auto scroll-py-1 overscroll-contain pr-1">
                    {quotes.length > 0 ? (
                      <div>
                        <div className="mb-1 text-[11px] font-medium text-white/40">基金</div>
                        <ul className="flex flex-col gap-2">
                          {quotes.map((quote) => (
                            <FundRow key={quote.code} quote={quote} />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {stockQuotes.length > 0 ? (
                      <div>
                        <div className="mb-1 mt-1 text-[11px] font-medium text-white/40">A 股</div>
                        <ul className="flex flex-col gap-2">
                          {stockQuotes.map((quote) => (
                            <StockRow key={quote.code} quote={quote} />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {!hasAnyList && !lastError ? (
                      <div className="rounded-2xl bg-black/25 px-3 py-3 text-[12px] text-white/60 ring-1 ring-white/10">
                        暂无数据，请在设置中添加基金或股票代码。
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
