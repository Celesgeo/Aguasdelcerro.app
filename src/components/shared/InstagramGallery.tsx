/** Placeholder for future Instagram API feed integration */
export default function InstagramGallery() {
  return (
    <section className="py-10 text-center">
      <p className="text-sm text-brand-cream/50 font-body tracking-wide">
        Feed de Instagram — listo para integrar con la API oficial
      </p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 opacity-40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square bg-brand-cream/5 border border-brand-gold/10" />
        ))}
      </div>
    </section>
  );
}
