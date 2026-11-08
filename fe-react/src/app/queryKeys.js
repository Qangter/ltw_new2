// Params must contain the COMPLETE query: filters, sort, page, pageSize, etc.
// Serializable values only; never tokens or form secrets.
export const queryKeys = {
  all: (sessionId) => ['session', sessionId],
  resource: (sessionId, resource) => ['session', sessionId, resource],
  list: (sessionId, resource, params = {}) => ['session', sessionId, resource, 'list', params],
  detail: (sessionId, resource, id, params = {}) => ['session', sessionId, resource, 'detail', String(id), params],
}
