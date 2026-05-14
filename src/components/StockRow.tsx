import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

import type { StockQuote } from '@/types/stock'
import { formatAmountYuan, formatVolumeLots } from '@/utils/formatMarket'
import { formatPercent, formatSignedNumber } from '@/utils/formatNumber'

type Props = {
  quote: StockQuote
}

export function StockRow({ quote }: Props) {
  const up = quote.changeAmount >= 0
  const tone = up ? 'text-emerald-300' : 'text-rose-300'

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-1 rounded-2xl bg-black/25 px-3 py-2 ring-1 ring-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-white/90">{quote.name}</div>
          <div className="text-[11px] text-white/45">{quote.code}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[13px] font-semibold tabular-nums text-white/90">
            {quote.price.toFixed(3)}
          </div>
          <div className={`flex items-center justify-end gap-1 text-[11px] font-medium tabular-nums ${tone}`}>
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            <span>
              {formatSignedNumber(quote.changeAmount, 3)}（{formatPercent(quote.changePercent)}）
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-white/50">
        <span>换手 {quote.turnoverRate.toFixed(2)}%</span>
        <span>量 {formatVolumeLots(quote.volumeLots)}</span>
        <span>额 {formatAmountYuan(quote.amountYuan)}</span>
      </div>
    </motion.li>
  )
}
