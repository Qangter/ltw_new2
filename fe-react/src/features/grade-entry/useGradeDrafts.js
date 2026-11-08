import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth.js'
import { queryKeys } from '../../app/queryKeys.js'
import { adminErrorMessage } from '../users/adminFeedback.js'
import { deleteGrade, enrollStudent, gradeResources, saveGrade } from './entryService.js'
import { draftValues, normalizedScores, validateScores, valuesEqual } from './gradeDraft.js'

export function useGradeDrafts(offeringId) {
  const { api, sessionId } = useAuth()
  const client = useQueryClient()
  const [drafts, setDrafts] = useState({})
  const draftsRef = useRef({})
  const running = useRef(false)
  const mounted = useRef(false)
  const [busy, setBusy] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [summary, setSummary] = useState(null)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const mutation = useMutation({ retry: false, mutationFn: ({ kind, id, body }) => {
    if (kind === 'save') return saveGrade(api, id, body)
    if (kind === 'delete') return deleteGrade(api, id)
    return enrollStudent(api, offeringId, body)
  } })
  const key = queryKeys.detail(sessionId, 'offering-students', offeringId)
  function put(id, value) {
    if (!mounted.current) return
    draftsRef.current = { ...draftsRef.current, [id]: value }
    setDrafts(draftsRef.current)
  }
  function edit(row, field, value) {
    const previous = draftsRef.current[row.enrollment_id]
    if (previous?.status === 'saving' || bulk) return
    const base = previous?.dirty ? previous.base : draftValues(row)
    const values = { ...(previous?.dirty ? previous.values : draftValues(row)), [field]: value }
    put(row.enrollment_id, { base, values, row, dirty: !valuesEqual(base, values), status: 'dirty', errors: {} })
    setSummary(null)
  }
  async function patchRow(id, values) {
    // Retire any GET started before this write so it cannot replace the response.
    await client.cancelQueries({ queryKey: key })
    client.setQueryData(key, (rows) => rows?.map((row) => String(row.enrollment_id) === String(id) ? { ...row, ...values } : row))
  }
  async function invalidate(enrolled = false) {
    await Promise.all([...gradeResources, ...(enrolled ? ['offerings'] : [])].map((resource) =>
      client.invalidateQueries({ queryKey: queryKeys.resource(sessionId, resource) })))
  }
  function start() {
    if (running.current) return false
    running.current = true
    setBusy(true)
    return true
  }
  function finish() { running.current = false; if (mounted.current) { setBusy(false); setBulk(false) } }
  async function save(id) {
    const draft = draftsRef.current[id]
    if (!draft?.dirty || !mounted.current) return false
    const { errors, body } = validateScores(draft.values)
    if (Object.keys(errors).length) {
      put(id, { ...draft, status: 'error', errors, error: 'Kiểm tra các trường điểm bên dưới.' })
      return false
    }
    put(id, { ...draft, status: 'saving', errors: {}, error: '' })
    try {
      const result = await mutation.mutateAsync({ kind: 'save', id, body })
      await patchRow(id, { ...normalizedScores(body), grade_id: result.id, total_score: result.total, letter_grade: result.letter, result: result.result })
      put(id, { dirty: false, status: 'saved' })
      await invalidate()
      return true
    } catch (error) {
      put(id, { ...draft, status: 'error', errors: {}, error: adminErrorMessage(error) })
      return false
    }
  }
  async function saveOne(id) {
    if (!start()) return
    try { await save(id) } finally { finish() }
  }
  async function saveAll() {
    if (!start()) return
    setBulk(true)
    setSummary(null)
    const ids = Object.keys(draftsRef.current).filter((id) => draftsRef.current[id].dirty)
    let succeeded = 0, failed = 0
    try {
      for (const id of ids) {
        if (!mounted.current) break
        if (await save(id)) succeeded++; else failed++
      }
      if (mounted.current) setSummary({ succeeded, failed })
    } finally { finish() }
  }
  async function remove(row) {
    if (!start()) return { ok: false }
    const previous = draftsRef.current[row.enrollment_id]
    put(row.enrollment_id, { ...previous, status: 'saving' })
    try {
      await mutation.mutateAsync({ kind: 'delete', id: row.grade_id })
      await patchRow(row.enrollment_id, { grade_id: null, attendance_score: null, midterm_score: null, final_score: null, total_score: null, letter_grade: null, result: null })
      put(row.enrollment_id, { dirty: false, status: 'deleted' })
      await invalidate()
      return { ok: true }
    } catch (error) {
      const message = adminErrorMessage(error)
      put(row.enrollment_id, { ...previous, status: 'error', error: message })
      return { ok: false, error: message }
    } finally { finish() }
  }
  async function enroll(code) {
    if (!start()) return { ok: false }
    try {
      await mutation.mutateAsync({ kind: 'enroll', body: code })
      await invalidate(true)
      return { ok: true }
    } catch (error) { return { ok: false, error: adminErrorMessage(error) } }
    finally { finish() }
  }
  return { drafts, edit, saveOne, saveAll, remove, enroll, busy, bulk, summary,
    dirty: Object.values(drafts).some((draft) => draft.dirty) }
}
