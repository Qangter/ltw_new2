import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../app/queryKeys.js'
import { ApiError } from '../../services/apiClient.js'
import { useAuth } from '../auth/useAuth.js'

// Shared by the two administration features. A ref closes the same-tick double-submit gap.
export function useAdminMutation({ mutationFn, resources, onSuccess, onError }) {
  const { user, sessionId } = useAuth()
  const client = useQueryClient()
  const locked = useRef(false)
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const mutation = useMutation({
    mutationFn: (variables) => {
      if (user?.role !== 'ADMIN') throw new ApiError('Bạn không có quyền thực hiện thao tác này.', 403)
      return mutationFn(variables)
    },
    // Invalidate the original session's cache even if this page has been left.
    onSuccess: () => Promise.all(resources.map((resource) => client.invalidateQueries({ queryKey: queryKeys.resource(sessionId, resource) }))),
  })
  async function submit(variables) {
    if (locked.current) return false
    locked.current = true
    try {
      const result = await mutation.mutateAsync(variables)
      if (mounted.current) onSuccess?.(result, variables)
      return true
    } catch (error) {
      // The mutation error remains available to the form/dialog; no automatic write retry.
      if (mounted.current) onError?.(error)
      return false
    } finally { locked.current = false }
  }
  return { ...mutation, submit }
}
