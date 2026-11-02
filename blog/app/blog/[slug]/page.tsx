import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getBlogPosts, readingTime } from 'app/blog/utils'
import { baseUrl, site } from 'app/site'
import { ArticleReader } from 'app/components/article-reader'

export async function generateStaticParams() {
  let posts = await getBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let post = (await getBlogPosts()).find((post) => post.slug === slug)
  if (!post) {
    return
  }

  let { title, publishedAt: publishedTime, summary: description } = post.metadata

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      modifiedTime: post.metadata.updatedAt,
      url: `${baseUrl}/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function Blog({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const posts = await getBlogPosts()
  const post = posts.find((post) => post.slug === slug)

  if (!post) {
    notFound()
  }
  const next = posts[posts.indexOf(post) + 1]

  return (
    <ArticleReader key={post.slug} title={post.metadata.title}>
      <section className="paper-sheet article-surface">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          // Escape < so a post title can't close this script tag early.
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.updatedAt ?? post.metadata.publishedAt,
            description: post.metadata.summary,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              '@type': 'Person',
              name: site.name,
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
      <Link className="article-back" href="/blog"><span aria-hidden="true">←</span> All writing</Link>
      <h1 className="page-title title">
        {post.metadata.title}
      </h1>
      <div className="article-date">
        <time dateTime={post.metadata.publishedAt}>
          {formatDate(post.metadata.publishedAt)}
        </time>
        <span>{readingTime(post)} min read</span>
      </div>
      {/* CMS posts arrive as HTML. */}
      <article className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
      <div className="article-end">
        <Link className="article-back" href="/blog"><span aria-hidden="true">←</span> All writing</Link>
        {next && (
          <Link className="article-next" href={`/blog/${next.slug}`}>
            <span>Next article <span aria-hidden="true">→</span></span>
            {next.metadata.title}
          </Link>
        )}
      </div>
      </section>
    </ArticleReader>
  )
}
