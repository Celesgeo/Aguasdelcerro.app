import Image from 'next/image';
import Link from 'next/link';
import { FaInstagram, FaPlay } from 'react-icons/fa';
import { SITE } from '@/lib/constants';
import { getInstagramFeed } from '@/lib/instagram';

export default async function InstagramGallery() {
  const { posts } = await getInstagramFeed(8);

  if (posts.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden border border-brand-gold/10 bg-brand-black/20"
            aria-label={post.caption ? `Ver en Instagram: ${post.caption}` : 'Ver en Instagram'}
          >
            <Image
              src={post.mediaType === 'VIDEO' && post.thumbnailUrl ? post.thumbnailUrl : post.mediaUrl}
              alt={post.caption ?? 'Publicación de Aguas del Cerro en Instagram'}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-brand-brown/0 transition-colors duration-500 group-hover:bg-brand-brown/45" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-brand-cream/40 bg-brand-brown/70 text-brand-cream">
                {post.mediaType === 'VIDEO' ? <FaPlay size={16} /> : <FaInstagram size={18} />}
              </span>
            </div>

            {post.mediaType === 'CAROUSEL_ALBUM' && (
              <span className="absolute top-3 right-3 text-brand-cream/90 text-xs tracking-widest uppercase font-body">
                +
              </span>
            )}
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center">
        <Link
          href={SITE.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm tracking-[0.18em] uppercase font-body text-brand-cream/60 hover:text-brand-gold transition-colors"
        >
          <FaInstagram size={14} />
          @aguasdelcerro
        </Link>
      </p>
    </div>
  );
}
