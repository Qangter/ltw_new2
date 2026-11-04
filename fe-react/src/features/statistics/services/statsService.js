const endpoints = {
  overview: '/api/stats/overview',
  'by-semester': '/api/stats/by-semester',
  distribution: '/api/stats/distribution',
  'by-department': '/api/stats/by-department',
  'by-subject': '/api/stats/by-subject',
}

// Each section has its own request/cache lifecycle; API aggregates are authoritative.
export function fetchStats(api, section, signal) {
  if (!Object.hasOwn(endpoints, section)) throw new Error('Nhóm thống kê không hợp lệ.')
  return api(endpoints[section], { signal })
}
