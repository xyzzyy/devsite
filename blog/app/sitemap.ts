import { getBlogPosts } from 'app/blog/utils'
import { baseUrl } from './site'

export default async function sitemap() {
  let blogs = (await getBlogPosts()).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.updatedAt ?? post.metadata.publishedAt,
  }))

  let routes = ['', '/blog', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
