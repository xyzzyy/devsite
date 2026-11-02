'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { PanelLighting } from './panel-lighting'

export function ArticleReader({ children, title }: { children: ReactNode; title: string }) {
  const readerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reader = readerRef.current
    const card = cardRef.current
    if (!reader || !card) return
    // Clear a previous hot-reloaded version's custom offset. The browser now owns
    // all scrolling, inertia and elastic movement; this loop only follows the light.
    card.style.removeProperty('transform')
    let frame = 0
    let touching = false
    let stableFrames = 0
    let previousTop = Number.NaN
    let previousLeft = Number.NaN

    const sample = () => {
      frame = 0
      const rect = card.getBoundingClientRect()
      if (rect.top !== previousTop || rect.left !== previousLeft) {
        previousTop = rect.top
        previousLeft = rect.left
        stableFrames = 0
        card.dispatchEvent(new Event('panel-motion'))
      } else {
        stableFrames += 1
      }
      // Native overscroll can keep moving after the last scroll event. Observe it
      // until the browser settles, without writing a position or changing input.
      if (touching || stableFrames < 12) frame = requestAnimationFrame(sample)
    }
    const follow = () => {
      stableFrames = 0
      if (!frame) frame = requestAnimationFrame(sample)
    }
    const touchStart = () => { touching = true; follow() }
    const touchEnd = () => { touching = false; follow() }

    reader.addEventListener('wheel', follow, { passive: true })
    reader.addEventListener('scroll', follow, { passive: true })
    reader.addEventListener('touchstart', touchStart, { passive: true })
    reader.addEventListener('touchend', touchEnd, { passive: true })
    reader.addEventListener('touchcancel', touchEnd, { passive: true })
    follow()
    return () => {
      cancelAnimationFrame(frame)
      reader.removeEventListener('wheel', follow)
      reader.removeEventListener('scroll', follow)
      reader.removeEventListener('touchstart', touchStart)
      reader.removeEventListener('touchend', touchEnd)
      reader.removeEventListener('touchcancel', touchEnd)
    }
  }, [])

  return (
    <div ref={readerRef} className="article-reader" role="region" aria-label={title} tabIndex={0}>
      <div ref={cardRef} className="article-card-layer">
        <PanelLighting layer="article" />
        {children}
      </div>
    </div>
  )
}
