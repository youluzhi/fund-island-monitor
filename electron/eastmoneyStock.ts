/**
 * 东方财富 push2 个股快照（非官方，可能变更；仅供个人学习）。
 */

export type StockQuotePayload = {
  code: string
  name: string
  price: number
  changeAmount: number
  changePercent: number
  turnoverRate: number
  volumeLots: number
  amountYuan: number
  updatedAt: number
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const STOCK_FIELDS = 'f43,f57,f58,f60,f169,f170,f168,f47,f48'

export function normalizeStockCode(raw: string): string {
  const digits = raw.trim().replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(6, '0').slice(-6)
}

/** 沪市 1.xxx / 深市 0.xxx；北交所 920 等先试 0. */
export function inferSecid(code6: string): string | null {
  if (!/^\d{6}$/.test(code6)) return null
  if (code6.startsWith('6') || code6.startsWith('688') || code6.startsWith('689')) {
    return `1.${code6}`
  }
  if (code6.startsWith('0') || code6.startsWith('3')) {
    return `0.${code6}`
  }
  if (code6.startsWith('9')) {
    return `0.${code6}`
  }
  return null
}

function normalizeStockOrder(codes: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of codes) {
    const n = normalizeStockCode(raw)
    if (n.length !== 6 || seen.has(n)) continue
    if (!inferSecid(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}

type EastMoneyStockData = {
  f43?: number
  f57?: string
  f58?: string
  f60?: number
  f169?: number
  f170?: number
  f168?: number
  f47?: number
  f48?: number
}

async function fetchOneStock(code6: string): Promise<StockQuotePayload> {
  const secid = inferSecid(code6)
  if (!secid) {
    throw new Error('无法识别市场（仅支持常见沪深 A 股代码）')
  }

  const url = new URL('https://push2.eastmoney.com/api/qt/stock/get')
  url.searchParams.set('secid', secid)
  url.searchParams.set('fields', STOCK_FIELDS)
  url.searchParams.set('fltt', '2')
  url.searchParams.set('invt', '2')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,*/*' },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const json = (await res.json()) as { data?: EastMoneyStockData | null; rc?: number }
  const d = json.data
  if (!d || json.rc !== 0) {
    throw new Error('无行情数据')
  }

  const price = Number(d.f43)
  if (!Number.isFinite(price)) {
    throw new Error('缺少现价')
  }

  const changeAmount = Number.isFinite(d.f169) ? Number(d.f169!.toFixed(3)) : 0
  const changePercent = Number.isFinite(d.f170) ? Number(d.f170!.toFixed(2)) : 0
  const turnoverRate = Number.isFinite(d.f168) ? Number(d.f168!.toFixed(2)) : 0
  const volumeLots = Number.isFinite(d.f47) ? Math.round(d.f47!) : 0
  const amountYuan = Number.isFinite(d.f48) ? d.f48! : 0

  return {
    code: String(d.f57 ?? code6).padStart(6, '0'),
    name: String(d.f58 ?? `股票 ${code6}`).trim(),
    price: Number(price.toFixed(3)),
    changeAmount,
    changePercent,
    turnoverRate,
    volumeLots,
    amountYuan,
    updatedAt: Date.now(),
  }
}

export async function fetchEastMoneyStockQuotes(codes: string[]): Promise<StockQuotePayload[]> {
  const normalized = normalizeStockOrder(codes)
  if (normalized.length === 0) {
    return []
  }

  const settled = await Promise.allSettled(normalized.map((code) => fetchOneStock(code)))
  const quotes: StockQuotePayload[] = []
  const errors: string[] = []

  for (let i = 0; i < settled.length; i += 1) {
    const r = settled[i]
    const code = normalized[i]
    if (r.status === 'fulfilled') {
      quotes.push(r.value)
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason)
      errors.push(`${code}: ${msg}`)
    }
  }

  if (quotes.length === 0) {
    throw new Error(errors.join('；') || '全部股票请求失败')
  }

  if (errors.length > 0) {
    console.warn('[eastmoneyStock]', errors.join('；'))
  }

  return quotes
}
