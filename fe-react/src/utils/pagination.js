export function getPageItems(page, pages) {
  const visible = new Set([1, pages])
  for (let n = Math.max(1, page - 2); n <= Math.min(pages, page + 2); n++) visible.add(n)
  const result = []
  for (const n of [...visible].filter((n) => n > 0).sort((a, b) => a - b)) {
    const last = result.at(-1)
    if (typeof last === 'number' && n - last > 1) result.push(`gap-${last}`)
    result.push(n)
  }
  return result
}
