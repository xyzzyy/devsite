# xyzzyy.dev

My personal site and blog, built with Next.js.

## Development

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev                     # http://localhost:3000
```

`pnpm build` makes a production build. It fails if the CMS is configured but can't be reached, rather than publishing an empty blog. `pnpm preview` builds the worker and runs it locally in the production runtime.

## Deploying

The site runs as a worker, configured in `wrangler.jsonc`. Pages are cached in an object storage bucket and refreshed in the background through a Durable Object queue (see `open-next.config.ts`).

1. Create the cache bucket once: `npx wrangler r2 bucket create devsite-cache`.
2. Set the variables below as build variables and as runtime variables (the CMS key as a secret). Pages are prerendered during the build, so the build needs them too.
3. `pnpm run deploy` builds and deploys the worker and fills the cache. To deploy on every push instead, connect the repo and set the root directory to `blog`.

## Configuration

Set these in `.env.local` for development, and as described in [Deploying](#deploying) for production.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public URL used in metadata, the sitemap, and RSS. Required in production; defaults to `http://localhost:3000`. |
| `CMS_POSTS_URL` | The CMS endpoint that lists posts. |
| `CMS_API_KEY` | Read-only key for that endpoint. |

Without the CMS variables, the site builds with an empty blog.

## Layout

- `app/page.tsx`, `app/blog`, `app/contact`: the pages.
- `app/blog/utils.ts`: loads posts from the CMS.
- `app/components/nav.tsx`: the sliding navigation switch.
- `app/components/panel-lighting.tsx`, `panel-material.ts`: the WebGL lighting shared by the panels and controls.
- `app/og-card.tsx`, `opengraph-image.tsx`: link-preview images for the site and each post.
- `app/rss`, `app/sitemap.ts`, `app/robots.ts`: the feed and search-engine files.
