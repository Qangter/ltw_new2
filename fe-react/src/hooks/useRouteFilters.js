import { useSearchParams } from 'react-router-dom'

export function readFilters(search, names, limit) {
  const filters = Object.fromEntries(names.map((name) => [name, search.get(name)?.trim() || '']))
  if (limit) {
    const page = Number(search.get('page'))
    filters.page = Number.isSafeInteger(page) && page > 0 ? page : 1
    filters.limit = limit
  }
  return filters
}

export function useRouteFilters(names, limit) {
  const [search, setSearch] = useSearchParams()
  const filters = readFilters(search, names, limit)
  function apply(values) {
    const next = new URLSearchParams(search)
    names.forEach((name) => {
      const value = String(values[name] ?? '').trim()
      if (value) next.set(name, value)
      else next.delete(name)
    })
    next.delete('page')
    setSearch(next)
  }
  function setPage(page) {
    const next = new URLSearchParams(search)
    if (page === 1) next.delete('page')
    else next.set('page', String(page))
    setSearch(next)
  }
  return { filters, apply, setPage, formKey: search.toString() }
}
