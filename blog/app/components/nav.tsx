'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { PANEL_LIGHT } from './panel-material'

const navItems = [
  { path: '/', name: 'home' },
  { path: '/blog', name: 'blog' },
  { path: '/contact', name: 'contact' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  // Unknown routes (404) highlight nothing, but the thumb still needs a resting slot.
  const matchIndex = navItems.findIndex(({ path }) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  )
  const activeIndex = Math.max(0, matchIndex)
  const [position, setPosition] = useState(activeIndex)
  const [dragging, setDragging] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const drag = useRef<{ id: number; x: number; position: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  useEffect(() => { setPosition(activeIndex) }, [activeIndex])

  useLayoutEffect(() => {
    const nav = navRef.current
    const thumb = thumbRef.current
    if (!nav || !thumb) return
    let frame = 0
    let previousX = Number.NaN
    let stable = 0
    const follow = () => {
      const rect = thumb.getBoundingClientRect()
      const x = rect.left
      // The CSS fallback uses the same viewport light and knob height as WebGL.
      const rise = parseFloat(getComputedStyle(thumb).getPropertyValue('--knob-rise')) || 16
      const dx = rect.left + rect.width / 2 - innerWidth * PANEL_LIGHT.x
      const dy = rect.top + rect.height / 2 - innerHeight * PANEL_LIGHT.y
      const distance = Math.max(PANEL_LIGHT.height - rise, 1)
      nav.style.setProperty('--knob-shadow-x', `${dx * rise / distance}px`)
      nav.style.setProperty('--knob-shadow-y', `${dy * rise / distance}px`)
      nav.style.setProperty('--knob-light-x', `${50 - dx / Math.hypot(dx, dy, distance) * 45}%`)
      nav.style.setProperty('--knob-light-y', `${50 - dy / Math.hypot(dx, dy, distance) * 45}%`)
      stable = x === previousX ? stable + 1 : 0
      previousX = x
      // Keep the handle's material under the same scene light while CSS moves it.
      nav.dispatchEvent(new Event('panel-motion', { bubbles: true }))
      if (stable < 4) frame = requestAnimationFrame(follow)
    }
    const restart = () => {
      cancelAnimationFrame(frame)
      previousX = Number.NaN
      stable = 0
      follow()
    }
    follow()
    window.addEventListener('resize', restart)
    window.addEventListener('scroll', restart, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', restart)
      window.removeEventListener('scroll', restart)
    }
  }, [position, dragging])

  const pointerDown = (event: PointerEvent<HTMLElement>) => {
    suppressClick.current = false
    if (event.button !== 0 || !event.isPrimary) return
    const rect = thumbRef.current?.getBoundingClientRect()
    if (!rect || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return
    const first = navRef.current?.querySelector('.nav-link')?.getBoundingClientRect()
    const currentPosition = first ? (rect.left + rect.width / 2 - first.left - first.width / 2) / first.width : position
    drag.current = { id: event.pointerId, x: event.clientX, position: currentPosition, moved: false }
  }
  const pointerMove = (event: PointerEvent<HTMLElement>) => {
    const gesture = drag.current
    if (!gesture || gesture.id !== event.pointerId) return
    const dx = event.clientX - gesture.x
    if (!gesture.moved && Math.abs(dx) < 5) return
    if (!gesture.moved) {
      gesture.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    event.preventDefault()
    const step = navRef.current?.querySelector('.nav-link')?.getBoundingClientRect().width || 1
    setPosition(Math.max(0, Math.min(2, gesture.position + dx / step)))
  }
  const pointerUp = (event: PointerEvent<HTMLElement>) => {
    const gesture = drag.current
    if (!gesture || gesture.id !== event.pointerId) return
    drag.current = null
    if (!gesture.moved) return
    suppressClick.current = true
    const step = navRef.current?.querySelector('.nav-link')?.getBoundingClientRect().width || 1
    const index = Math.max(0, Math.min(2, Math.round(gesture.position + (event.clientX - gesture.x) / step)))
    setDragging(false)
    setPosition(index)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (index !== matchIndex) router.push(navItems[index].path)
  }
  const cancel = () => {
    drag.current = null
    setDragging(false)
    setPosition(activeIndex)
  }

  return (
    <header className="site-header">
      <Link href="/" className="site-brand">xyzzyy.dev</Link>
      <nav
        ref={navRef}
        aria-label="Main navigation"
        id="nav"
        className="nav-tray"
        data-dragging={dragging || undefined}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={cancel}
        onPointerLeave={() => { if (drag.current && !drag.current.moved) drag.current = null }}
        onLostPointerCapture={() => { if (drag.current) cancel() }}
        onClickCapture={event => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault()
            event.stopPropagation()
            suppressClick.current = false
          }
        }}
      >
        <span className="nav-track" aria-hidden="true" />
        <span className="nav-rail" aria-hidden="true" />
        <span ref={thumbRef} className="nav-thumb" aria-hidden="true" style={{ transform: `translateX(calc(var(--nav-slot-width) * ${position}))` }}>
          <span className="nav-thumb-face" />
        </span>
        {navItems.map(({ path, name }, index) => {
          const active = index === matchIndex
          return (
            <Link
              key={path}
              href={path}
              className="nav-link"
              draggable={false}
              aria-current={active ? 'page' : undefined}
              onClick={event => {
                if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setPosition(index)
              }}
            >
              {name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
