import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

function getFocusable(dialog) {
  return [...dialog.querySelectorAll(focusable)].filter((element) =>
    element.tabIndex >= 0 && !element.closest('[hidden], [inert]') && element.getClientRects().length > 0,
  )
}

export function Modal({ open, title, description, children, onClose, initialFocusRef, dismissible = true }) {
  const ref = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    const target = initialFocusRef?.current
    if (target && dialog.contains(target) && !target.disabled) target.focus()
    else dialog.querySelector('[data-modal-close]')?.focus()

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open, initialFocusRef])

  if (!open) return null

  function onKeyDown(event) {
    if (event.key !== 'Tab') return
    const items = getFocusable(event.currentTarget)
    const first = items[0]
    const last = items.at(-1)
    if (!first) {
      event.preventDefault()
      event.currentTarget.querySelector('[data-modal-title]')?.focus()
    } else if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <dialog ref={ref} className="modal react-modal" aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined} aria-modal="true"
      onKeyDown={onKeyDown} onCancel={(event) => {
        event.preventDefault()
        if (dismissible) onClose()
      }}>
      <header className="modal-header">
        <h2 id={titleId} tabIndex={-1} data-modal-title>{title}</h2>
        <button type="button" className="sec sm" data-modal-close disabled={!dismissible}
          aria-label="Đóng hộp thoại" onClick={onClose}>×</button>
      </header>
      {description && <p id={descriptionId}>{description}</p>}
      {children}
    </dialog>, document.body,
  )
}
