import path from 'path'

type Metadata = {
  title: string
  publishedAt: string
  updatedAt?: string
  summary: string
}

export type Post = {
  metadata: Metadata
  slug: string
  content: string
}

// How often edits, new posts, and deletions in the CMS reach the site.
const CMS_REVALIDATE_SECONDS = 300

type CmsPost = {
  published: string
  updated: string
  url: string
  title: string
  content: string
}

function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function summarize(text: string, length = 160) {
  if (text.length <= length) return text
  return `${text.slice(0, text.lastIndexOf(' ', length)).replace(/[\s.,;:]+$/, '')}…`
}

// The slug is the permalink's last path segment, e.g. .../2024/04/post-title.html → post-title.
function permalinkSlug(url: string) {
  return path.basename(new URL(url).pathname, '.html')
}

async function getCmsPosts(): Promise<Post[]> {
  let postsUrl = process.env.CMS_POSTS_URL
  let apiKey = process.env.CMS_API_KEY
  if (!postsUrl || !apiKey) return []

  let posts: Post[] = []
  let pageToken: string | undefined
  do {
    let url = new URL(postsUrl)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('maxResults', '500')
    url.searchParams.set('fields', 'nextPageToken,items(published,updated,url,title,content)')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    let response = await fetch(url, {
      next: { revalidate: CMS_REVALIDATE_SECONDS, tags: ['cms'] },
    })
    if (!response.ok) {
      throw new Error(`CMS request failed (${response.status}): ${await response.text()}`)
    }
    let data: { items?: CmsPost[]; nextPageToken?: string } = await response.json()

    for (let item of data.items ?? []) {
      posts.push({
        slug: permalinkSlug(item.url),
        content: item.content,
        metadata: {
          title: item.title,
          publishedAt: item.published,
          updatedAt: item.updated,
          summary: summarize(htmlToText(item.content)),
        },
      })
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  return posts
}

// Published posts, newest first.
export async function getBlogPosts() {
  return (await getCmsPosts()).sort(
    (a, b) => new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime()
  )
}

export function readingTime(post: Post) {
  return Math.max(1, Math.ceil(htmlToText(post.content).split(' ').length / 220))
}

export function formatDate(date: string) {
  // Use the calendar date the post was written on, not the server's time zone.
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
