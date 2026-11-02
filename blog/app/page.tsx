import Link from 'next/link'
import { PostList } from 'app/components/posts'
import { Panel } from 'app/components/panel'
import { site } from './site'

const preferences = [
  { label: 'Sample one', value: 'First' },
  { label: 'Sample two', value: 'Second' },
  { label: 'Sample three', value: 'Third' },
]

export default function Page() {
  return (
    <>
      <div className="hero-grid">
        <Panel as="section" className="intro-panel">
          <h1 className="hero-title">{site.name}</h1>
          <p className="intro-copy">
            I write about software, the tools I use, and what I learn along the way.
            A place for notes on working with code and getting the small details right.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/blog">Read the blog</Link>
            <Link className="button button-secondary" href="/contact">Contact</Link>
          </div>
        </Panel>
        <Panel as="section" className="row-panel preferences-panel">
          <h2 className="sr-only">Preferences</h2>
          <ul className="rows">
            {preferences.map(({ label, value }) => (
              <li key={label}>
                {/* Placeholder: these buttons don't do anything yet. */}
                <button type="button" className="row">
                  <span className="row-label">{label}</span>
                  <span className="keycap">{value}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <section className="home-section" aria-labelledby="latest-writing">
        <div className="section-heading">
          <h2 id="latest-writing">Writing</h2>
          <Link className="text-link" href="/blog">All posts <span aria-hidden="true">→</span></Link>
        </div>
        <PostList limit={5} />
      </section>
    </>
  )
}
