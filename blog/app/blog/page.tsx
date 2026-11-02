import { PostList } from 'app/components/posts'
import { site } from 'app/site'

export const metadata = {
  title: 'Blog',
  description: site.description,
}

export default function Page() {
  return (
    <section aria-labelledby="page-title">
      <header className="page-heading">
        <h1 id="page-title" className="page-title">Writing</h1>
        <p className="page-description">{site.description}</p>
      </header>
      <PostList />
    </section>
  )
}
