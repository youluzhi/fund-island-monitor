import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

import type { FundQuote } from '@/types/fund'
import { formatNav, formatPercent, formatSignedNumber } from '@/utils/formatNumber'

type Props = {
  quote: FundQuote
}

export function FundRow({ quote }: Props) {
  const up = quote.changeAmount >= 0
  const tone = up ? 'text-emerald-300' : 'text-rose-300'

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-2xl bg-black/25 px-3 py-2 ring-1 ring-white/10"
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-white/90">{quote.name}</div>
        <div className="text-[11px] text-white/45">{quote.code}</div>
      </div>
      <div className="text-right">
        <div className="text-[13px] font-semibold tabular-nums text-white/90">{formatNav(quote.navEstimate)}</div>
        <div className={`flex items-center justify-end gap-1 text-[11px] font-medium tabular-nums ${tone}`}>
          {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          <span>
            {formatSignedNumber(quote.changeAmount, 4)}（{formatPercent(quote.changePercent)}）
          </span>
        </div>
      </div>
    </motion.li>
  )
}
