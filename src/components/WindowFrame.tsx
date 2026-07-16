import type { ReactNode } from 'react'

type WindowFrameProps = {
  title: string
  children: ReactNode
  className?: string
  footer?: ReactNode
  toolbar?: ReactNode
}

export function WindowFrame({ title, children, className = '', footer, toolbar }: WindowFrameProps) {
  return (
    <section className={`win ${className}`}>
      <header className="win__titlebar">
        <span className="win__title">{title}</span>
        <div className="win__controls" aria-hidden="true">
          <span className="win__dot" />
          <span className="win__dot" />
          <span className="win__dot win__dot--close" />
        </div>
      </header>
      {toolbar ? <div className="win__toolbar">{toolbar}</div> : null}
      <div className="win__body">{children}</div>
      {footer ? <footer className="win__status">{footer}</footer> : null}
    </section>
  )
}
