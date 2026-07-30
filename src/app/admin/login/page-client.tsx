'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SITE } from '@/lib/constants';

export default function AdminLoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'No se pudo ingresar');
        return;
      }
      router.replace(search.get('next') || '/admin');
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-brand-gold/25 bg-brand-black/40 px-4 py-3.5 text-brand-cream font-body focus:outline-none focus:border-brand-gold';

  return (
    <div className="min-h-screen bg-brand-brown flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md border border-brand-gold/20 bg-brand-black/30 p-8 md:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Image src="/images/logo.png" alt={SITE.name} width={88} height={88} className="rounded-full mb-4" />
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold font-body">Administración</p>
          <h1 className="font-display text-3xl text-brand-cream mt-2">Panel de socios</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-brand-cream/50 mb-2 font-body">
              Usuario
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-brand-cream/50 mb-2 font-body">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-300 font-body">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gold text-brand-brown py-3.5 text-sm tracking-[0.2em] uppercase font-body disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
