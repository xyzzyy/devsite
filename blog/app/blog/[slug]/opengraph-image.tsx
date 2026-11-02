import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getBlogPosts } from 'app/blog/utils'
import { OgCard, ogSize } from 'app/og-card'

export const size = ogSize
export const contentType = 'image/png'

export async function generateStaticParams() {
  return (await getBlogPosts()).map((post) => ({ slug: post.slug }))
}

// Only real posts get a card, so the image can't be made to say anything else.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = (await getBlogPosts()).find((post) => post.slug === slug)
  if (!post) notFound()
  return new ImageResponse(<OgCard title={post.metadata.title} />, size)
}
