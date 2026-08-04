export const formatDate = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  return `${date} ${time}`
}

export const formatDateTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  return `${date} ${time}`
}

export const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return '0.00'
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
}
