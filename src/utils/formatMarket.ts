/** 成交量（手）→ 万手 */
export function formatVolumeLots(lots: number): string {
  if (!Number.isFinite(lots) || lots <= 0) return '—'
  if (lots >= 10_000) {
    return `${(lots / 10_000).toFixed(2)}万手`
  }
  return `${lots.toLocaleString('zh-CN')}手`
}

/** 成交额（元） */
export function formatAmountYuan(yuan: number): string {
  if (!Number.isFinite(yuan) || yuan <= 0) return '—'
  if (yuan >= 1e8) {
    return `${(yuan / 1e8).toFixed(2)}亿`
  }
  if (yuan >= 1e4) {
    return `${(yuan / 1e4).toFixed(2)}万`
  }
  return `${yuan.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}元`
}
