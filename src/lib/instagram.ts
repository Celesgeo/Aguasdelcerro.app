import { SITE } from '@/lib/constants';
import { getGalleryImages, getImagesByCategory, type MediaImage } from '@/lib/media';

export interface InstagramPost {
  id: string;
  permalink: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  caption?: string;
}

type InstagramFeed = {
  posts: InstagramPost[];
  source: 'api' | 'curated';
};

const REVALIDATE_SECONDS = 3600;

function pickCuratedImages(limit: number): MediaImage[] {
  const pools = [
    getImagesByCategory('termas'),
    getImagesByCategory('mirador'),
    getImagesByCategory('atardeceres'),
    getImagesByCategory('paisajes'),
    getImagesByCategory('restaurante'),
    getGalleryImages(),
  ];

  const seen = new Set<string>();
  const picked: MediaImage[] = [];

  for (const pool of pools) {
    for (const image of pool) {
      if (picked.length >= limit) break;
      if (seen.has(image.src)) continue;
      seen.add(image.src);
      picked.push(image);
    }
    if (picked.length >= limit) break;
  }

  return picked.slice(0, limit);
}

function mapApiPost(raw: {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
}): InstagramPost | null {
  const mediaUrl = raw.media_url ?? raw.thumbnail_url;
  if (!mediaUrl || !raw.permalink) return null;

  const mediaType =
    raw.media_type === 'VIDEO'
      ? 'VIDEO'
      : raw.media_type === 'CAROUSEL_ALBUM'
        ? 'CAROUSEL_ALBUM'
        : 'IMAGE';

  return {
    id: raw.id,
    permalink: raw.permalink,
    mediaUrl,
    thumbnailUrl: raw.thumbnail_url,
    mediaType,
    caption: raw.caption?.trim(),
  };
}

async function fetchInstagramApiPosts(limit: number): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return [];

  const url = new URL('https://graph.instagram.com/me/media');
  url.searchParams.set('fields', 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', token);

  const response = await fetch(url.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { data?: unknown[] };
  const posts: InstagramPost[] = [];

  for (const item of payload.data ?? []) {
    const mapped = mapApiPost(item as Parameters<typeof mapApiPost>[0]);
    if (mapped) posts.push(mapped);
  }

  return posts;
}

function buildCuratedPosts(limit: number): InstagramPost[] {
  return pickCuratedImages(limit).map((image, index) => ({
    id: `curated-${index}-${image.filename}`,
    permalink: SITE.instagram,
    mediaUrl: image.src,
    mediaType: 'IMAGE' as const,
    caption: image.alt,
  }));
}

/** Feed de Instagram: API oficial si hay token; si no, galería curada del sitio. */
export async function getInstagramFeed(limit = 8): Promise<InstagramFeed> {
  try {
    const apiPosts = await fetchInstagramApiPosts(limit);
    if (apiPosts.length > 0) {
      return { posts: apiPosts.slice(0, limit), source: 'api' };
    }
  } catch {
    // Fallback silencioso a galería curada.
  }

  return { posts: buildCuratedPosts(limit), source: 'curated' };
}
