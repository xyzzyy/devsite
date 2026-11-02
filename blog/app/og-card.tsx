import { site } from './site'

export const ogSize = { width: 1200, height: 630 }

// The link-preview card shared by the site and each post.
export function OgCard({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', padding: 64, background: '#191a19', color: '#e5e4df' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', padding: 48, border: '1px solid #444643', borderRadius: 24, background: 'linear-gradient(135deg, #242624, #30312c)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 22, color: '#b1b5af' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, border: '1px solid #61665e', color: '#e0e2da' }}>am</span>
          {site.name}
        </div>
        <h2 style={{ fontSize: title.length > 65 ? 52 : 70, fontWeight: 500, letterSpacing: '-2px', lineHeight: 1.12, margin: '32px 0' }}>
          {title.slice(0, 160)}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 18, color: '#a2b7c6' }}>
          <span style={{ width: 28, height: 3, background: '#6d91ad', borderRadius: 2 }} />
          {site.description}
        </div>
      </div>
    </div>
  )
}
