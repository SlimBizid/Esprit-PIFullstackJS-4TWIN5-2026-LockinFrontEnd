import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const siteUrl = (process.env.VITE_SITE_URL || 'http://localhost:3010').replace(
  /\/$/,
  '',
)

const routes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/challenges', changefreq: 'daily', priority: '0.9' },
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${new URL(path, `${siteUrl}/`).toString()}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const robots = `User-agent: *
Disallow:
Sitemap: ${new URL('/sitemap.xml', `${siteUrl}/`).toString()}
`

const outputPath = resolve('public/sitemap.xml')
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, sitemap)
writeFileSync(resolve('public/robots.txt'), robots)

console.log(`Generated sitemap at ${outputPath} using ${siteUrl}`)
