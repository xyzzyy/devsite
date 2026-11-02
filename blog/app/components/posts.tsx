import Link from 'next/link'
import { Panel } from './panel'
import { formatDate, getBlogPosts, readingTime } from 'app/blog/utils'

export async function PostList({ limit }: { limit?: number }) {
  const posts = (await getBlogPosts()).slice(0, limit)

  return (
    <Panel className="row-panel">
      <ul className="rows">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link className="row post-row" href={`/blog/${post.slug}`}>
              <span className="post-text">
                <span className="row-label post-title">{post.metadata.title}</span>
                <span className="row-detail">{post.metadata.summary}</span>
              </span>
              <span className="post-meta">
                <time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt)}</time>
                <span>{readingTime(post)} min</span>
              </span>
              <span className="row-chevron" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
