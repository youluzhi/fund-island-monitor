export function formatSignedNumber(value: number, fractionDigits = 2) {
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${value.toFixed(fractionDigits)}`
}

export function formatPercent(value: number, fractionDigits = 2) {
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${value.toFixed(fractionDigits)}%`
}

export function formatNav(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}
