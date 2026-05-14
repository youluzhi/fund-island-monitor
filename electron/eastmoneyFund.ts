/**
 * 天天基金 / 东方财富「基金估值」JSONP 接口（非官方公开端点，可能变更；仅供个人学习使用）。
 * Tushare / AkShare / 聚合数据 等需 Token 或 Python 侧调用，未在此直连。
 */

export type FundQuotePayload = {
  code: string
  name: string
  navEstimate: number
  changeAmount: number
  changePercent: number
  updatedAt: number
}

type EastMoneyGzJson = {
  fundcode?: string
  name?: string
  jzrq?: string
  dwjz?: string
  gsz?: string
  gszzl?: string
  gztime?: string
}

const FUNDGZ_BASE = 'https://fundgz.1234567.com.cn/js'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

export function normalizeFundCode(raw: string): string {
  const digits = raw.trim().replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(6, '0').slice(-6)
}

function parseJsonpToJson(text: string): EastMoneyGzJson {
  const trimmed = text.trim()
  const m = trimmed.match(/\w+\((\{[\s\S]*\})\)\s*;?\s*$/)
  if (!m?.[1]) {
    throw new Error('响应格式异常')
  }
  return JSON.parse(m[1]) as EastMoneyGzJson
}

function parseGzTimeMs(gztime?: string): number {
  if (!gztime?.trim()) return Date.now()
  const normalized = gztime.trim().replace(/-/g, '/')
  const t = Date.parse(normalized)
  return Number.isFinite(t) ? t : Date.now()
}

async function fetchOneQuote(code: string): Promise<FundQuotePayload> {
  const url = `${FUNDGZ_BASE}/${code}.js`
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const text = await res.text()
  const j = parseJsonpToJson(text)

  const name = j.name?.trim() || `基金 ${code}`
  const dwjz = Number(j.dwjz)
  const gsz = Number(j.gsz)
  const gszzl = Number(j.gszzl)

  if (!Number.isFinite(gsz)) {
    throw new Error('缺少估算净值')
  }

  const navEstimate = Number(gsz.toFixed(4))
  const changePercent = Number.isFinite(gszzl) ? Number(gszzl.toFixed(2)) : 0
  const changeAmount =
    Number.isFinite(dwjz) && Number.isFinite(gsz) ? Number((gsz - dwjz).toFixed(4)) : 0

  return {
    code: normalizeFundCode(j.fundcode ?? code),
    name,
    navEstimate,
    changeAmount,
    changePercent,
    updatedAt: parseGzTimeMs(j.gztime),
  }
}

function normalizePreserveOrder(codes: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of codes) {
    const n = normalizeFundCode(raw)
    if (n.length !== 6 || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}

export async function fetchEastMoneyFundQuotes(codes: string[]): Promise<FundQuotePayload[]> {
  const normalized = normalizePreserveOrder(codes)
  if (normalized.length === 0) {
    return []
  }

  const settled = await Promise.allSettled(normalized.map((code) => fetchOneQuote(code)))

  const quotes: FundQuotePayload[] = []
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
    throw new Error(errors.join('；') || '全部基金请求失败')
  }

  if (errors.length > 0) {
    console.warn('[eastmoneyFund]', errors.join('；'))
  }

  return quotes
}
