import { baseUrl, site } from 'app/site'
import { getBlogPosts } from 'app/blog/utils'

const escapeXml = (value: string) => value.replace(/[<>&"']/g, character => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[character]!)

// Build the feed once and refresh it with the CMS, instead of on every request.
export const revalidate = 300

export async function GET() {
  let allBlogs = await getBlogPosts()

  const itemsXml = allBlogs
    .map(
      (post) =>
        `<item>
          <title>${escapeXml(post.metadata.title)}</title>
          <link>${escapeXml(`${baseUrl}/blog/${post.slug}`)}</link>
          <description>${escapeXml(post.metadata.summary || '')}</description>
          <pubDate>${new Date(
            post.metadata.publishedAt
          ).toUTCString()}</pubDate>
        </item>`
    )
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
        <title>${escapeXml(site.name)}</title>
        <link>${escapeXml(baseUrl)}</link>
        <description>${escapeXml(site.description)}</description>
        ${itemsXml}
    </channel>
  </rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
