'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { getCareerPositionLabel, type CareerApplicationRecord } from '@/lib/careers';

export default function AdminCareersInbox() {
  const [applications, setApplications] = useState<CareerApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/careers')
      .then((response) => response.json())
      .then((data: { ok?: boolean; error?: string; applications?: CareerApplicationRecord[] }) => {
        if (!data.ok) throw new Error(data.error || 'No se pudo cargar');
        setApplications(data.applications ?? []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Postulaciones">
      <p className="text-sm text-brand-dark/55 font-body mb-8">
        {applications.length} postulación{applications.length === 1 ? '' : 'es'} recibidas desde el formulario web.
      </p>

      {error && (
        <p className="text-red-600 text-sm font-body bg-red-50 border border-red-100 px-4 py-3 mb-6">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-brand-dark/50 font-body">Cargando…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-brand-dark/50 font-body">Todavía no hay postulaciones guardadas en este servidor.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((item) => (
            <article key={item.id} className="border border-brand-brown/15 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-subtitle text-lg text-brand-brown">{item.nombre}</h2>
                  <p className="text-xs tracking-[0.2em] uppercase text-brand-gold font-body mt-1">
                    {getCareerPositionLabel(item.puesto)}
                  </p>
                </div>
                <p className="text-xs text-brand-dark/45 font-body">
                  {new Date(item.createdAt).toLocaleString('es-AR')}
                </p>
              </div>
              <p className="mt-3 text-sm text-brand-dark/75 font-body">
                {item.telefono} · {item.email} · {item.localidad}
              </p>
              <p className="mt-3 text-sm text-brand-dark/70 font-body whitespace-pre-wrap">{item.presentacion}</p>
              {item.cvSize > 0 ? (
                <a
                  href={`/api/admin/careers/${item.id}/cv`}
                  className="inline-block mt-4 text-xs tracking-[0.15em] uppercase text-brand-brown border border-brand-gold/40 px-4 py-2 font-body hover:bg-brand-gold/10"
                >
                  Descargar CV
                </a>
              ) : (
                <p className="mt-3 text-xs text-brand-dark/40 font-body">Sin CV adjunto</p>
              )}
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
