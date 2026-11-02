import { Panel } from 'app/components/panel'
import { site } from 'app/site'

export const metadata = {
  title: 'Contact',
  description: 'Contact and profile links.',
}

export default function ContactPage() {
  return (
    <section aria-labelledby="page-title">
      <header className="page-heading">
        <h1 id="page-title" className="page-title">Contact</h1>
        <p className="page-description">Have a question or an idea? Find me at the links below.</p>
      </header>
      <Panel className="row-panel">
        <ul className="rows">
          {site.profiles.map(({ platform, handle, href }) => (
            <li key={href}>
              <a className="row" href={href} target="_blank" rel="noopener noreferrer">
                <span className="post-text">
                  <span className="row-label">{handle}</span>
                  <span className="row-detail">{platform}</span>
                </span>
                <span className="keycap">Open <span aria-hidden="true">↗</span></span>
              </a>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  )
}
