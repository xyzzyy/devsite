'use client'

import { useEffect, useRef } from 'react'
import { createPanelRenderer, PANEL_LIGHT, type MaterialPrimitive } from './panel-material'

const selector = '.surface, .paper-sheet, .button-primary, .button-secondary, .keycap, .nav-track, .nav-rail, .nav-thumb, .nav-thumb-face'

export function PanelLighting({ layer = 'page' }: { layer?: 'page' | 'article' }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const shell = canvas?.closest(layer === 'article' ? '.article-card-layer' : '.site-shell')
    if (!canvas || !shell) return
    let renderer = createPanelRenderer(canvas)
    if (!renderer) return
    let frame = 0
    let stopped = false
    let elements: HTMLElement[] = []
    const observed = new Set<Element>()

    const fallback = () => {
      canvas.style.opacity = '0'
      for (const element of elements) delete element.dataset.panelMaterial
    }
    const resize = new ResizeObserver(() => schedule())
    const draw = () => {
      if (stopped) return
      // The canvas and text share the same scrolling ancestor. Rect differences stay
      // constant even during elastic overscroll, before another JS frame can run.
      const canvasWidth = `${layer === 'article' ? shell.clientWidth + 40 : document.documentElement.clientWidth}px`
      if (canvas.style.width !== canvasWidth) canvas.style.width = canvasWidth
      const canvasRect = canvas.getBoundingClientRect()
      const width = canvasRect.width
      const height = canvasRect.height
      if (width <= 0 || height <= 0) return
      const lightPosition: [number, number] = [
        window.innerWidth * PANEL_LIGHT.x - canvasRect.left,
        window.innerHeight * PANEL_LIGHT.y - canvasRect.top,
      ]
      elements = Array.from(shell.querySelectorAll<HTMLElement>(selector)).filter(element =>
        layer === 'article' || !element.closest('.article-card-layer')
      )
      for (const element of Array.from(observed)) {
        if (!elements.includes(element as HTMLElement)) {
          resize.unobserve(element)
          observed.delete(element)
        }
      }
      const primitives: MaterialPrimitive[] = layer === 'article' ? [] : [{
        rect: [-1, -1, width + 2, height + 2], radius: 0,
        top: 0, rise: 0, bevel: [0, 0], gloss: 0.5, roughness: 0.55,
        color: [0.16, 0.005, 265], border: 0, lift: 0.55,
      }]
      // DOM order also puts a control above its supporting panel.
      for (const element of elements) {
        if (!observed.has(element)) {
          resize.observe(element)
          observed.add(element)
        }
        const r = element.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const panel = element.classList.contains('surface')
        const paper = element.classList.contains('paper-sheet')
        const blue = element.classList.contains('button-primary')
        const track = element.classList.contains('nav-track')
        const rail = element.classList.contains('nav-rail')
        const thumb = element.classList.contains('nav-thumb')
        const thumbFace = element.classList.contains('nav-thumb-face')
        const style = getComputedStyle(element)
        const number = (name: string, fallback: number) => {
          const value = parseFloat(style.getPropertyValue(name))
          return Number.isFinite(value) ? value : fallback
        }
        const onPanel = Boolean(element.parentElement?.closest('.surface'))
        const panelRise = number('--panel-rise', 4)
        const knobRise = number('--knob-rise', 16)
        const rise = paper ? 1.2 : rail || thumbFace ? 0 : track ? 2 : thumb ? knobRise : panel ? panelRise : blue ? 5 : 3
        primitives.push({
          // Keep offscreen panels in the scene too: compositor scrolling can reveal
          // them before a scroll event reaches the main thread.
          rect: [r.left - canvasRect.left, r.top - canvasRect.top, r.width, r.height],
          radius: parseFloat(style.borderTopLeftRadius) || 0,
          top: (onPanel ? panelRise : 0) + (thumbFace ? knobRise - 0.5 : rise),
          rise,
          bevel: paper ? [0.65, 0.08] : rail ? [3, -1.4] : thumbFace ? [3, -0.6] : thumb ? [7, 2.8] : track ? [4, 1.3] : panel ? [number('--panel-bevel-width', 5), number('--panel-bevel-height', 1.5)] : blue ? [6, 2] : [4, 1.2],
          gloss: paper ? 0.015 : rail ? 0.15 : thumb || thumbFace ? 0.32 : panel ? number('--panel-gloss', 0.45) : blue ? 0.7 : 0.5,
          roughness: paper ? 0.92 : rail ? 0.65 : thumb || thumbFace ? 0.48 : panel ? number('--panel-roughness', 0.45) : blue ? 0.3 : 0.4,
          color: paper ? [1.0, 0.015, 84] : thumb ? [1.0, 0, 0] : thumbFace ? [0.94, 0.003, 250] : rail ? [0.2, 0.025, 250] : track ? [0.46, 0.065, 250] : panel ? [0.225, 0.006, 265] : blue ? [0.6, 0.13, 258] : [0.3, 0.006, 265],
          border: paper || blue || rail || thumbFace ? 0 : 0.06,
          paper,
        })
      }
      if (renderer?.draw(primitives, width, height, window.devicePixelRatio || 1, lightPosition)) {
        canvas.style.opacity = '1'
        for (const element of elements) element.dataset.panelMaterial = 'rune'
      } else fallback()
    }
    const schedule = () => {
      if (stopped) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }
    const scroll = (event: Event) => {
      if (layer === 'article' || event.target === document) schedule()
    }
    const mutations = new MutationObserver(schedule)
    mutations.observe(shell, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current'] })
    const lost = (event: Event) => {
      event.preventDefault()
      fallback()
    }
    const restored = () => {
      renderer?.destroy()
      renderer = createPanelRenderer(canvas)
      schedule()
    }
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', scroll, { passive: true, capture: true })
    shell.addEventListener('panel-motion', draw)
    resize.observe(shell)
    document.fonts.ready.then(schedule)
    schedule()
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      resize.disconnect()
      mutations.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', scroll, true)
      shell.removeEventListener('panel-motion', draw)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
      renderer?.destroy()
      fallback()
    }
  }, [layer])

  return <canvas ref={ref} className="panel-lighting" aria-hidden="true" />
}
