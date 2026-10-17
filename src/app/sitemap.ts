import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  return [
    {
      url: new URL('/', siteUrl).toString(),
      priority: 1,
    },
  ];
}
