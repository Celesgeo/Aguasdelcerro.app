'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { SITE } from '@/lib/constants';
import { STOCK_CATEGORIES } from '@/lib/stock-shared';
import type { StockMovement, StockProduct } from '@/lib/stock-store';
import { shiftLabel, type VisitorShiftId } from '@/lib/visitor-shifts';

const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const NAME_KEY = 'adc-stock-staff-name';
const UNDO_MINUTES = 15;

type Session = {
  viewer: 'admin' | 'staff' | null;
  pinConfigured: boolean;
  shiftId: VisitorShiftId;
  businessDate: string;
};

function groupByCategory(products: StockProduct[]) {
  const order = new Map<string, number>(STOCK_CATEGORIES.map((c, i) => [c, i]));
  const groups = new Map<string, StockProduct[]>();
  for (const p of products) {
    const list = groups.get(p.category) ?? [];
    list.push(p);
    groups.set(p.category, list);
  }
  return [...groups.entries()].sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99));
}

function stockBadge(p: StockProduct) {
  if (p.quantity === null) return { text: 'Sin control', cls: 'bg-brand-brown/10 text-brand-brown/70' };
  if (p.quantity === 0) return { text: 'Agotado', cls: 'bg-red-100 text-red-700' };
  if (p.quantity <= p.lowAlert) return { text: `Quedan ${p.quantity}`, cls: 'bg-amber-100 text-amber-800' };
  return { text: `${p.quantity} und`, cls: 'bg-emerald-100 text-emerald-800' };
}

export default function StockStaff() {
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [sales, setSales] = useState<StockMovement[]>([]);
  const [pin, setPin] = useState('');
  const [staffName, setStaffName] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [units, setUnits] = useState<Record<string, number>>({});
  const [, forceTick] = useState(0);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/stock/session', { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSession(data);
      return data as Session;
    } catch {
      setError('No se pudo conectar. Revisá internet y recargá la página.');
      return null;
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        fetch('/api/stock/products', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/stock/sales', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      if (p.ok) setProducts(p.products);
      if (s.ok) setSales(s.sales);
      if (!p.ok && p.error === 'No autorizado') void loadSession();
    } catch {
      // se reintenta en el próximo ciclo
    }
  }, [loadSession]);

  useEffect(() => {
    try {
      setStaffName(localStorage.getItem(NAME_KEY) ?? '');
    } catch {
      // sin localStorage: se pide el nombre cada vez
    }
    void loadSession().then((s) => {
      if (s?.viewer) void loadData();
    });
  }, [loadSession, loadData]);

  // Actualiza cada 30 s (otro compañero puede estar vendiendo) y refresca el turno.
  useEffect(() => {
    if (!session?.viewer) return;
    const timer = window.setInterval(() => {
      void loadData();
      void loadSession();
      forceTick((n) => n + 1);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [session?.viewer, loadData, loadSession]);

  const saveName = (value: string) => {
    setStaffName(value);
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      // ignorar
    }
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy('login');
    try {
      const res = await fetch('/api/stock/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Clave incorrecta');
      setPin('');
      const s = await loadSession();
      if (s?.viewer) await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo ingresar');
    } finally {
      setBusy(null);
    }
  };

  const logout = async () => {
    await fetch('/api/stock/session', { method: 'DELETE' });
    setProducts([]);
    setSales([]);
    void loadSession();
  };

  const sell = async (product: StockProduct) => {
    const qty = units[product.id] ?? 1;
    if (!staffName.trim()) {
      setError('Escribí tu nombre arriba antes de vender.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(product.id);
    try {
      const res = await fetch('/api/stock/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, units: qty, staffName: staffName.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo registrar');
      setNotice(`Vendido: ${qty} × ${product.name} · ${ARS.format(product.unitPrice * qty)}`);
      setUnits((u) => ({ ...u, [product.id]: 1 }));
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar');
      void loadData();
    } finally {
      setBusy(null);
    }
  };

  const undo = async (sale: StockMovement) => {
    if (!window.confirm(`¿Anular la venta de ${sale.units} × ${sale.productName}? Vuelve al stock.`)) return;
    setBusy(sale.id);
    setError(null);
    try {
      const res = await fetch(`/api/stock/sales/${sale.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo anular');
      setNotice('Venta anulada.');
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo anular');
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, search]);

  const activeSales = sales.filter((s) => !s.voided);
  const shiftTotal = activeSales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = products.filter((p) => p.quantity !== null && p.quantity <= p.lowAlert);

  /* ------------------------------ Pantallas ------------------------------ */

  const header = (
    <header className="bg-brand-brown border-b border-brand-gold/15">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt={SITE.name} width={40} height={40} className="rounded-full" />
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-brand-gold font-body">Stock del turno</p>
            <p className="font-display text-lg text-brand-cream leading-tight">
              {session ? shiftLabel(session.shiftId) : 'Aguas del Cerro'}
            </p>
          </div>
        </div>
        {session?.viewer && (
          <button
            type="button"
            onClick={logout}
            className="text-[11px] tracking-[0.15em] uppercase border border-brand-gold/30 text-brand-gold px-3 py-2 font-body"
          >
            Salir
          </button>
        )}
      </div>
    </header>
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-cream">
        {header}
        <p className="p-8 text-center font-body text-brand-brown/70">{error ?? 'Cargando…'}</p>
      </div>
    );
  }

  if (!session.viewer) {
    return (
      <div className="min-h-screen bg-brand-cream">
        {header}
        <form onSubmit={login} className="mx-auto max-w-sm px-6 py-12 space-y-4">
          <h1 className="font-display text-2xl text-brand-brown">Ingresá la clave del personal</h1>
          {!session.pinConfigured && (
            <p className="text-sm font-body text-amber-800 bg-amber-50 border border-amber-200 p-3">
              El administrador todavía no definió la clave. Se carga desde el panel de administración → Stock.
            </p>
          )}
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
            className="w-full border border-brand-brown/20 bg-white px-4 py-3 text-2xl tracking-[0.4em] text-center font-body"
            placeholder="••••••"
            aria-label="Clave"
          />
          {error && <p className="text-sm text-red-700 font-body">{error}</p>}
          <button
            type="submit"
            disabled={busy === 'login' || pin.length < 6}
            className="w-full bg-brand-brown text-brand-cream py-3 font-body tracking-[0.15em] uppercase text-sm disabled:opacity-50"
          >
            {busy === 'login' ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-16">
      {header}
      <main className="mx-auto max-w-3xl px-4 py-5 space-y-5 font-body">
        <section className="bg-white border border-brand-brown/10 p-4 space-y-3">
          <label className="block text-xs uppercase tracking-[0.15em] text-brand-brown/70">
            Tu nombre
            <input
              value={staffName}
              onChange={(e) => saveName(e.target.value.slice(0, 60))}
              placeholder="Ej.: Sofía"
              className="mt-1 w-full border border-brand-brown/20 px-3 py-2 text-base normal-case tracking-normal text-brand-dark"
            />
          </label>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-brand-brown/70">Vendido en este turno</span>
            <span className="font-display text-2xl text-brand-brown">{ARS.format(shiftTotal)}</span>
          </div>
        </section>

        {lowStock.length > 0 && (
          <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 p-3">
            Poco stock: {lowStock.map((p) => `${p.name} (${p.quantity})`).join(', ')}. Avisale al administrador.
          </p>
        )}
        {error && <p className="text-sm bg-red-50 border border-red-200 text-red-800 p-3">{error}</p>}
        {notice && <p className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 p-3">{notice}</p>}

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto…"
          className="w-full border border-brand-brown/20 bg-white px-4 py-3 text-base"
        />

        {groupByCategory(filtered).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60 mb-2">{category}</h2>
            <ul className="space-y-2">
              {items.map((p) => {
                const badge = stockBadge(p);
                const qty = units[p.id] ?? 1;
                const soldOut = p.quantity === 0;
                const noPrice = p.unitPrice <= 0;
                const maxUnits = p.quantity === null ? 50 : Math.min(50, p.quantity);
                return (
                  <li key={p.id} className="bg-white border border-brand-brown/10 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-brand-dark font-medium leading-tight">{p.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="text-brand-brown">{noPrice ? 'Precio a definir' : ARS.format(p.unitPrice)}</span>
                        <span className={`px-2 py-0.5 text-xs ${badge.cls}`}>{badge.text}</span>
                      </div>
                    </div>
                    <div className="flex items-center border border-brand-brown/20">
                      <button
                        type="button"
                        aria-label="Menos"
                        onClick={() => setUnits((u) => ({ ...u, [p.id]: Math.max(1, qty - 1) }))}
                        className="w-9 h-10 text-lg text-brand-brown"
                      >
                        −
                      </button>
                      <span className="w-7 text-center">{qty}</span>
                      <button
                        type="button"
                        aria-label="Más"
                        onClick={() => setUnits((u) => ({ ...u, [p.id]: Math.min(Math.max(1, maxUnits), qty + 1) }))}
                        className="w-9 h-10 text-lg text-brand-brown"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => sell(p)}
                      disabled={soldOut || noPrice || busy === p.id}
                      className="bg-brand-brown text-brand-cream px-4 h-10 text-xs uppercase tracking-[0.15em] disabled:opacity-40"
                    >
                      {busy === p.id ? '…' : 'Vender'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {filtered.length === 0 && <p className="text-center text-brand-brown/60">No hay productos.</p>}

        <section className="bg-white border border-brand-brown/10 p-4">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60 mb-3">Ventas de este turno</h2>
          {sales.length === 0 ? (
            <p className="text-sm text-brand-brown/60">Todavía no hay ventas.</p>
          ) : (
            <ul className="divide-y divide-brand-brown/10">
              {sales.map((s) => {
                const ageMin = (Date.now() - new Date(s.createdAt).getTime()) / 60000;
                const canUndo = !s.voided && (session.viewer === 'admin' || ageMin <= UNDO_MINUTES);
                return (
                  <li key={s.id} className={`py-2 flex items-center gap-3 text-sm ${s.voided ? 'opacity-50 line-through' : ''}`}>
                    <span className="text-brand-brown/60 w-12">
                      {new Date(s.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex-1">
                      {s.units} × {s.productName}
                      <span className="block text-xs text-brand-brown/60">{s.staffName}</span>
                    </span>
                    <span>{ARS.format(s.total)}</span>
                    {canUndo && (
                      <button
                        type="button"
                        onClick={() => undo(s)}
                        disabled={busy === s.id}
                        className="text-xs text-red-700 underline"
                      >
                        Anular
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-brand-brown/50">
            Si te equivocaste, podés anular una venta dentro de los {UNDO_MINUTES} minutos.
          </p>
        </section>
      </main>
    </div>
  );
}
