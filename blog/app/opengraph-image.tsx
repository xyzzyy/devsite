import { ImageResponse } from 'next/og'
import { OgCard, ogSize } from './og-card'
import { site } from './site'

export const alt = site.name
export const size = ogSize
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(<OgCard title="Code, tools & small details." />, size)
}
