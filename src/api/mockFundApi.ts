import type { FundQuote } from '@/types/fund'

type SeedFund = Pick<FundQuote, 'code' | 'name'> & {
  baseNav: number
  volatility: number
}

const SEED_FUNDS: SeedFund[] = [
  { code: '000001', name: '华夏成长混合', baseNav: 1.1245, volatility: 0.004 },
  { code: '110022', name: '易方达消费行业', baseNav: 3.9821, volatility: 0.006 },
  { code: '161725', name: '招商中证白酒', baseNav: 1.2567, volatility: 0.01 },
  { code: '519772', name: '交银新生活力', baseNav: 2.341, volatility: 0.005 },
  { code: '005827', name: '易方达蓝筹精选', baseNav: 1.8765, volatility: 0.007 },
]

const seedByCode = new Map(SEED_FUNDS.map((item) => [item.code, item]))

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function randomWalkNav(baseNav: number, volatility: number, tick: number) {
  const drift = Math.sin(tick / 17_000) * volatility * baseNav
  const noise = (Math.random() - 0.5) * volatility * baseNav
  const next = baseNav + drift + noise
  return clamp(Number(next.toFixed(4)), baseNav * 0.92, baseNav * 1.08)
}

function buildQuote(code: string, tick: number): FundQuote {
  const seed =
    seedByCode.get(code) ??
    ({
      code,
      name: `自选 ${code}`,
      baseNav: 1 + (code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 200) / 100,
      volatility: 0.006,
    } satisfies SeedFund)

  const navEstimate = randomWalkNav(seed.baseNav, seed.volatility, tick)
  const prevClose = seed.baseNav * (0.995 + (Math.sin(tick / 25_000) + 1) * 0.0025)
  const changeAmount = Number((navEstimate - prevClose).toFixed(4))
  const changePercent = Number(((changeAmount / prevClose) * 100).toFixed(2))

  return {
    code: seed.code,
    name: seed.name,
    navEstimate,
    changeAmount,
    changePercent,
    updatedAt: Date.now(),
  }
}

export async function fetchFundQuotesMock(codes: string[]): Promise<FundQuote[]> {
  await new Promise((resolve) => setTimeout(resolve, 220 + Math.random() * 180))
  const normalized = codes.map((c) => c.trim()).filter(Boolean)
  const tick = Date.now()
  return normalized.map((code) => buildQuote(code, tick))
}
