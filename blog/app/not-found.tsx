import Link from 'next/link'
import { Panel } from './components/panel'

export default function NotFound() {
  return (
    <Panel as="section" className="intro-panel not-found-panel">
      <span className="keycap keycap-static">404</span>
      <h1 className="hero-title">Page not found</h1>
      <p className="intro-copy">This page may have moved, or the link may be incorrect.</p>
      <div className="button-row">
        <Link className="button button-primary" href="/">Back to home</Link>
      </div>
    </Panel>
  )
}
