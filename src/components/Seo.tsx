import { useEffect } from 'react'

type SeoProps = {
  title: string
  description: string
  path?: string
  robots?: string
}

const SITE_NAME = 'LockIN'

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  let meta = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  )

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let link =
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  link.setAttribute('href', href)
}

function upsertStructuredData(payload: Record<string, unknown>) {
  let script = document.head.querySelector<HTMLScriptElement>(
    'script[data-seo-structured-data="true"]',
  )

  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seoStructuredData = 'true'
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(payload)
}

export function Seo({
  title,
  description,
  path = '/',
  robots = 'index,follow',
}: SeoProps) {
  useEffect(() => {
    const siteUrl =
      import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') ||
      window.location.origin
    const canonicalUrl = new URL(path, `${siteUrl}/`).toString()
    const fullTitle = `${title} | ${SITE_NAME}`
    const imageUrl = new URL('/LogInCover.png', `${siteUrl}/`).toString()
    const structuredDataType = path === '/' ? 'WebSite' : 'WebPage'

    document.title = fullTitle
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', robots)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:image:alt', `${SITE_NAME} preview image`)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', imageUrl)
    upsertCanonical(canonicalUrl)
    upsertStructuredData({
      '@context': 'https://schema.org',
      '@type': structuredDataType,
      name: fullTitle,
      description,
      url: canonicalUrl,
    })
  }, [description, path, robots, title])

  return null
}
