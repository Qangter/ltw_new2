import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../app/queryKeys.js'
import { useAuth } from '../auth/useAuth.js'
import { downloadTemplate, getImportTemplate, importGrades, importOutcomeUnknown, importResources } from './importService.js'

export function useGradeImport() {
  const { api, sessionId } = useAuth()
  const client = useQueryClient()
  const locked = useRef(false)
  const templateController = useRef(null)
  const mounted = useRef(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; templateController.current?.abort() }
  }, [])
  const invalidate = () => Promise.all(importResources.map((resource) => client.invalidateQueries({ queryKey: queryKeys.resource(sessionId, resource) })))
  const mutation = useMutation({
    mutationFn: (file) => importGrades(api, file), retry: false,
    onSuccess: (result) => { if (result.created + result.updated > 0) return invalidate() },
    onError: (error) => {
      // Some rows may have committed before a broken response. Refresh without claiming success.
      if (error.name !== 'AbortError' && importOutcomeUnknown(error)) return invalidate()
    },
  })
  useEffect(() => {
    if (!mutation.isPending) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [mutation.isPending])

  async function submit(file) {
    if (locked.current) return false
    locked.current = true
    try { await mutation.mutateAsync(file); return true }
    catch { return false } // mutation.error remains visible; no automatic resend
    finally { locked.current = false }
  }
  async function download() {
    if (templateController.current) return
    const controller = new AbortController()
    templateController.current = controller
    setDownloading(true)
    setDownloadError('')
    try {
      const blob = await getImportTemplate(api, controller.signal)
      if (mounted.current) downloadTemplate(blob)
    } catch (error) {
      if (mounted.current && error.name !== 'AbortError') setDownloadError(error.message)
    } finally {
      templateController.current = null
      if (mounted.current) setDownloading(false)
    }
  }
  return { ...mutation, submit, download, downloading, downloadError }
}
