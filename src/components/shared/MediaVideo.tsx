'use client';

interface MediaVideoProps {
  src: string;
  poster: string;
  className?: string;
  label?: string;
}

export default function MediaVideo({ src, poster, className = '', label }: MediaVideoProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        className="absolute inset-0 h-full w-full object-cover"
        aria-label={label ?? 'Video Aguas del Cerro'}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black/50 via-transparent to-transparent pointer-events-none" />
      {label && (
        <p className="absolute bottom-5 left-5 text-xs tracking-[0.25em] uppercase text-brand-cream/85 font-body pointer-events-none">
          {label}
        </p>
      )}
    </div>
  );
}
