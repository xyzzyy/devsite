import type { ReactNode } from 'react'

type PanelProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section'
}

export function Panel({ children, className = '', as = 'div' }: PanelProps) {
  const classes = `surface ${className}`
  if (as === 'section') return <section className={classes}>{children}</section>
  return <div className={classes}>{children}</div>
}
