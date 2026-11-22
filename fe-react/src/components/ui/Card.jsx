import { useId } from 'react'

export function Card({ title, children, className = '', icon }) {
  const id = useId()
  return <section className={`card ${className}`} aria-labelledby={title ? id : undefined}>
    {title && <h2 id={id}>{icon && <span className="card-title-icon" aria-hidden="true">{icon}</span>}{title}</h2>}
    {children}
  </section>
}
