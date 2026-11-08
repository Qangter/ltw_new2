import { useId } from 'react'

export function Card({ title, children, className = '' }) {
  const id = useId()
  return <section className={`card ${className}`} aria-labelledby={title ? id : undefined}>
    {title && <h2 id={id}>{title}</h2>}
    {children}
  </section>
}
