type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Inserta JSON-LD en el documento para datos estructurados de Google. */
export default function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload) }}
    />
  );
}
