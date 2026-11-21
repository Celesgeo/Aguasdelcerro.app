'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { SITE } from '@/lib/constants';
import { STOCK_CATEGORIES } from '@/lib/stock-shared';
import type { ShiftMembership } from '@/lib/stock-memberships';
import type { StockMovement, StockProduct } from '@/lib/stock-store';
import { shiftLabel, type VisitorShiftId } from '@/lib/visitor-shifts';

const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const NAME_KEY = 'adc-stock-staff-name';
const UNDO_MINUTES = 15;

const PAYMENT_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mercadopago: 'Mercado Pago (online)',
};

type MembershipInfo = {
  unitPrice: number;
  maxPerSale: number;
  remaining: number | null;
  memberships: ShiftMembership[];
};

type Session = {
  viewer: 'admin' | 'staff' | null;
  pinConfigured: boolean;
  staffName: string;
  sellerId: string | null;
  daysThisWeek: number | null;
  sessionEndsAt: string | null;
  sellers: { id: string; name: string }[];
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
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [units, setUnits] = useState<Record<string, number>>({});
  const [, forceTick] = useState(0);
  const [mInfo, setMInfo] = useState<MembershipInfo | null>(null);
  const [mQty, setMQty] = useState(1);
  const [mPay, setMPay] = useState<string>('efectivo');
  const [mName, setMName] = useState('');
  const [pPay, setPPay] = useState<string>('efectivo');
  const [shiftEnded, setShiftEnded] = useState(false);
  const [closing, setClosing] = useState({ openingFloat: '', cashCounted: '', note: '' });
  const [closures, setClosures] = useState<{ staffName: string; createdAt: string }[]>([]);
  const wasLoggedIn = useRef(false);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/stock/session', { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSession(data);
      setStaffName(data.staffName || '');
      // Si estaba adentro y la sesión ya no existe, terminó el turno: se limpia la pantalla.
      if (wasLoggedIn.current && !data.viewer) {
        setShiftEnded(true);
        setProducts([]);
        setSales([]);
        setMInfo(null);
      }
      wasLoggedIn.current = Boolean(data.viewer);
      return data as Session;
    } catch {
      setError('No se pudo conectar. Revisá internet y recargá la página.');
      return null;
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [p, s, m, c] = await Promise.all([
        fetch('/api/stock/products', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/stock/sales', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/stock/memberships', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/stock/closure', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      if (c.ok) setClosures(c.closures);
      if (p.ok) setProducts(p.products);
      if (s.ok) setSales(s.sales);
      if (m.ok) setMInfo(m);
      if (!p.ok && p.error === 'No autorizado') void loadSession();
    } catch {
      // se reintenta en el próximo ciclo
    }
  }, [loadSession]);

  useEffect(() => {
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

  const rememberLocally = (value: string) => {
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      // ignorar
    }
  };

  /** Guarda el nombre en la sesión del servidor (no se pierde si el navegador borra datos). */
  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    const value = nameDraft.trim();
    if (!value) return;
    setBusy('name');
    setError(null);
    try {
      const res = await fetch('/api/stock/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName: value }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo guardar el nombre');
      setStaffName(data.staffName);
      rememberLocally(data.staffName);
      setEditingName(false);
      setNotice(`Hola ${data.staffName}. Días trabajados esta semana: ${data.daysThisWeek}.`);
      await loadSession();
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el nombre');
    } finally {
      setBusy(null);
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
      setNameDraft('');
      setShiftEnded(false);
      const s = await loadSession();
      if (s?.viewer) await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo ingresar');
    } finally {
      setBusy(null);
    }
  };

  const closeCash = async (e: FormEvent) => {
    e.preventDefault();
    const cashCounted = Number(closing.cashCounted.replace(/\D/g, ''));
    const openingFloat = Number(closing.openingFloat.replace(/\D/g, '') || 0);
    if (!closing.cashCounted.trim()) return;
    if (!window.confirm(`¿Cerrar la caja del turno con ${ARS.format(cashCounted)} en efectivo?`)) return;
    setBusy('closure');
    setError(null);
    try {
      const res = await fetch('/api/stock/closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashCounted, openingFloat, note: closing.note }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo cerrar la caja');
      setClosing({ openingFloat: '', cashCounted: '', note: '' });
      setNotice('Cierre de caja enviado al administrador.');
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cerrar la caja');
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
      setError('Escribí tu nombre arriba y tocá Guardar antes de vender.');
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
        body: JSON.stringify({ productId: product.id, units: qty, staffName: staffName.trim(), paymentMethod: pPay }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo registrar');
      setNotice(`Vendido: ${qty} × ${product.name} · ${ARS.format(product.unitPrice * qty)} · ${PAYMENT_LABEL[pPay]}`);
      setUnits((u) => ({ ...u, [product.id]: 1 }));
      setPPay('efectivo');
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar');
      void loadData();
    } finally {
      setBusy(null);
    }
  };

  const giveBack = async (product: StockProduct) => {
    const qty = units[product.id] ?? 1;
    if (!window.confirm(`¿Devolvieron ${qty} ${product.name}? Vuelve${qty > 1 ? 'n' : ''} al stock.`)) return;
    setError(null);
    setNotice(null);
    setBusy(`ret:${product.id}`);
    try {
      const res = await fetch('/api/stock/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, units: qty, staffName }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo registrar la devolución');
      setNotice(`Devolución registrada: ${qty} × ${product.name}. Disponibles: ${data.product.quantity}.`);
      setUnits((u) => ({ ...u, [product.id]: 1 }));
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la devolución');
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

  const sellMembership = async (e: FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setError('Escribí tu nombre arriba y tocá Guardar antes de cargar.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    setNotice(null);
    setBusy('membership');
    try {
      const res = await fetch('/api/stock/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: mQty, paymentMethod: mPay, name: mName, staffName: staffName.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar');
      setNotice(
        `Membresía cargada: ${mQty} persona${mQty > 1 ? 's' : ''} · ${PAYMENT_LABEL[mPay]} · ${ARS.format(data.membership.total)} · código ${data.membership.code}`,
      );
      setMQty(1);
      setMName('');
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar');
    } finally {
      setBusy(null);
    }
  };

  const undoMembership = async (m: ShiftMembership) => {
    if (!window.confirm(`¿Anular la membresía presencial de ${m.quantity} persona(s) (${ARS.format(m.total)})?`)) return;
    setBusy(m.id);
    setError(null);
    try {
      const res = await fetch(`/api/stock/memberships/${m.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo anular');
      setNotice('Membresía anulada.');
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
  const memberships = mInfo?.memberships ?? [];
  const inPerson = memberships.filter((m) => m.origin === 'presencial');
  const online = memberships.filter((m) => m.origin === 'online');
  const inPersonTotal = inPerson.reduce((n, m) => n + m.total, 0);
  const people = (list: ShiftMembership[]) => list.reduce((n, m) => n + m.quantity, 0);
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
          <h1 className="font-display text-2xl text-brand-brown">Ingreso del personal</h1>
          {shiftEnded && (
            <p className="text-sm font-body text-brand-brown bg-white border border-brand-brown/15 p-3">
              Terminó el turno y la sesión se cerró sola. El próximo turno tiene que ingresar de nuevo.
            </p>
          )}
          {!session.pinConfigured && (
            <p className="text-sm font-body text-amber-800 bg-amber-50 border border-amber-200 p-3">
              El administrador todavía no definió la clave. Se carga desde el panel de administración → Stock.
            </p>
          )}
          <input
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 40))}
            className="w-full border border-brand-brown/20 bg-white px-4 py-3 text-lg text-center font-body"
            placeholder="Clave"
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
          {editingName || !staffName || !session.sellerId ? (
            <form onSubmit={saveName} className="flex gap-2 items-end">
              <label className="flex-1 block text-xs uppercase tracking-[0.15em] text-brand-brown/70">
                ¿Quién atiende?
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value.slice(0, 60))}
                  placeholder="Ej.: Sofía"
                  autoFocus
                  list="adc-sellers"
                  autoComplete="off"
                  className="mt-1 w-full border border-brand-brown/20 px-3 py-2 text-base normal-case tracking-normal text-brand-dark"
                />
                <datalist id="adc-sellers">
                  {session.sellers.map((seller) => (
                    <option key={seller.id} value={seller.name} />
                  ))}
                </datalist>
              </label>
              <button
                type="submit"
                disabled={busy === 'name' || !nameDraft.trim()}
                className="bg-brand-brown text-brand-cream px-4 h-[42px] text-xs uppercase tracking-[0.15em] disabled:opacity-40"
              >
                Guardar
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-brand-brown/70">
                Atiende:{' '}
                <strong className="text-brand-dark text-base">
                  {staffName}
                  {session.daysThisWeek !== null && session.daysThisWeek !== undefined ? ` (${session.daysThisWeek})` : ''}
                </strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setNameDraft('');
                  setEditingName(true);
                }}
                className="text-xs uppercase tracking-[0.15em] text-brand-brown underline"
              >
                Cambiar
              </button>
            </div>
          )}
          <dl className="text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-brand-brown/70">Productos</dt>
              <dd>{ARS.format(shiftTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-brown/70">Membresías presenciales ({people(inPerson)})</dt>
              <dd>{ARS.format(inPersonTotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-brand-brown/10 pt-2">
              <dt className="text-brand-brown/80">Cobrado en el parque este turno</dt>
              <dd className="font-display text-2xl text-brand-brown">{ARS.format(shiftTotal + inPersonTotal)}</dd>
            </div>
            <div className="flex justify-between text-xs text-brand-brown/60">
              <dt>Membresías online (ya pagadas por Mercado Pago)</dt>
              <dd>
                {people(online)} pers. · {ARS.format(online.reduce((n, m) => n + m.total, 0))}
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-white border border-brand-brown/10 p-4 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60">Membresías del turno</h2>
            {mInfo?.remaining !== null && mInfo?.remaining !== undefined && (
              <span className="text-xs text-brand-brown/60">Cupo libre: {mInfo.remaining}</span>
            )}
          </div>

          <form onSubmit={sellMembership} className="space-y-3 bg-brand-cream/50 p-3">
            <p className="text-sm text-brand-dark">
              Cargar venta presencial · {mInfo ? ARS.format(mInfo.unitPrice) : '…'} por persona
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-brand-brown/20 bg-white">
                <button type="button" aria-label="Menos" onClick={() => setMQty((q) => Math.max(1, q - 1))} className="w-10 h-10 text-lg text-brand-brown">
                  −
                </button>
                <span className="w-10 text-center">{mQty}</span>
                <button
                  type="button"
                  aria-label="Más"
                  onClick={() => setMQty((q) => Math.min(mInfo?.maxPerSale ?? 20, q + 1))}
                  className="w-10 h-10 text-lg text-brand-brown"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-brand-brown/70">persona{mQty > 1 ? 's' : ''}</span>
              <span className="ml-auto font-display text-xl text-brand-brown">
                {mInfo ? ARS.format(mInfo.unitPrice * mQty) : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['efectivo', 'transferencia', 'tarjeta'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setMPay(method)}
                  className={`px-3 py-2 text-xs uppercase tracking-[0.1em] border ${
                    mPay === method ? 'bg-brand-brown text-brand-cream border-brand-brown' : 'bg-white border-brand-brown/20 text-brand-brown'
                  }`}
                >
                  {PAYMENT_LABEL[method]}
                </button>
              ))}
            </div>
            <input
              value={mName}
              onChange={(e) => setMName(e.target.value.slice(0, 80))}
              placeholder="Nombre del cliente (opcional)"
              className="w-full border border-brand-brown/20 bg-white px-3 py-2 text-base"
            />
            <button
              type="submit"
              disabled={busy === 'membership' || !mInfo}
              className="w-full bg-brand-brown text-brand-cream py-3 text-xs uppercase tracking-[0.15em] disabled:opacity-50"
            >
              {busy === 'membership' ? 'Cargando…' : 'Cargar membresía'}
            </button>
          </form>

          {memberships.length === 0 ? (
            <p className="text-sm text-brand-brown/60">Todavía no hay membresías en este turno.</p>
          ) : (
            <ul className="divide-y divide-brand-brown/10">
              {memberships.map((m) => {
                const ageMin = (Date.now() - new Date(m.createdAt).getTime()) / 60000;
                const canUndo = m.origin === 'presencial' && (session.viewer === 'admin' || ageMin <= UNDO_MINUTES);
                return (
                  <li key={m.id} className="py-2 flex items-center gap-3 text-sm">
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${
                        m.origin === 'online' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {m.origin === 'online' ? 'Online' : 'Presencial'}
                    </span>
                    <span className="flex-1">
                      {m.quantity} × {m.name}
                      <span className="block text-xs text-brand-brown/60">
                        {m.code} · {PAYMENT_LABEL[m.paymentMethod ?? ''] ?? m.paymentMethod}
                        {m.soldBy ? ` · ${m.soldBy}` : ''}
                      </span>
                    </span>
                    <span>{ARS.format(m.total)}</span>
                    {canUndo && (
                      <button type="button" onClick={() => undoMembership(m)} disabled={busy === m.id} className="text-xs text-red-700 underline">
                        Anular
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {lowStock.length > 0 && (
          <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 p-3">
            Poco stock: {lowStock.map((p) => `${p.name} (${p.quantity})`).join(', ')}. Avisale al administrador.
          </p>
        )}
        {error && <p className="text-sm bg-red-50 border border-red-200 text-red-800 p-3">{error}</p>}
        {notice && <p className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 p-3">{notice}</p>}

        <div className="bg-white border border-brand-brown/10 p-3 space-y-2">
          <p className="text-xs uppercase tracking-[0.15em] text-brand-brown/70">Cobro de productos</p>
          <div className="flex flex-wrap gap-2">
            {(['efectivo', 'transferencia', 'tarjeta'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPPay(method)}
                className={`px-3 py-2 text-xs uppercase tracking-[0.1em] border ${
                  pPay === method ? 'bg-brand-brown text-brand-cream border-brand-brown' : 'bg-white border-brand-brown/20 text-brand-brown'
                }`}
              >
                {PAYMENT_LABEL[method]}
              </button>
            ))}
          </div>
          <p className="text-xs text-brand-brown/50">Después de cada venta vuelve a Efectivo.</p>
        </div>

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
                const maxUnits = p.quantity === null || p.isRental ? 50 : Math.min(50, p.quantity);
                return (
                  <li key={p.id} className="bg-white border border-brand-brown/10 p-3 flex flex-wrap items-center gap-3">
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
                      {busy === p.id ? '…' : p.isRental ? 'Alquilar' : 'Vender'}
                    </button>
                    {p.isRental && (
                      <button
                        type="button"
                        onClick={() => giveBack(p)}
                        disabled={busy === `ret:${p.id}`}
                        className="w-full border border-emerald-700/40 text-emerald-800 h-10 text-xs uppercase tracking-[0.15em] disabled:opacity-40"
                      >
                        {busy === `ret:${p.id}` ? '…' : `Devolvieron ${qty}`}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {filtered.length === 0 && <p className="text-center text-brand-brown/60">No hay productos.</p>}

        <section className="bg-white border border-brand-brown/10 p-4">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60 mb-3">Ventas de productos de este turno</h2>
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
                      <span className="block text-xs text-brand-brown/60">
                        {s.staffName}
                        {s.paymentMethod ? ` · ${PAYMENT_LABEL[s.paymentMethod] ?? s.paymentMethod}` : ''}
                      </span>
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

        <section className="bg-white border border-brand-brown/10 p-4 space-y-3">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60">Cierre de caja del turno</h2>
          {closures.length > 0 && (
            <p className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 p-2">
              Caja cerrada por {closures[0]!.staffName} a las{' '}
              {new Date(closures[0]!.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.
              {closures.length > 1 ? ` (${closures.length} cierres en este turno)` : ''}
            </p>
          )}
          <form onSubmit={closeCash} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-brand-brown/70">
                Fondo inicial (cambio)
                <input
                  inputMode="numeric"
                  value={closing.openingFloat}
                  onChange={(e) => setClosing((c) => ({ ...c, openingFloat: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="$ 0"
                  className="mt-1 w-full border border-brand-brown/20 px-3 py-2 text-base"
                />
              </label>
              <label className="block text-xs text-brand-brown/70">
                Efectivo contado
                <input
                  inputMode="numeric"
                  value={closing.cashCounted}
                  onChange={(e) => setClosing((c) => ({ ...c, cashCounted: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="$"
                  className="mt-1 w-full border border-brand-brown/20 px-3 py-2 text-base"
                />
              </label>
            </div>
            <input
              value={closing.note}
              onChange={(e) => setClosing((c) => ({ ...c, note: e.target.value.slice(0, 300) }))}
              placeholder="Nota (opcional)"
              className="w-full border border-brand-brown/20 px-3 py-2 text-base"
            />
            <button
              type="submit"
              disabled={busy === 'closure' || !closing.cashCounted}
              className="w-full bg-brand-brown text-brand-cream py-3 text-xs uppercase tracking-[0.15em] disabled:opacity-50"
            >
              {busy === 'closure' ? 'Enviando…' : 'Cerrar caja'}
            </button>
            <p className="text-xs text-brand-brown/50">
              Contá todo el efectivo de la caja (incluido el cambio con el que arrancaste) antes de enviar.
            </p>
          </form>
        </section>

        {session.sessionEndsAt && (
          <p className="text-center text-xs text-brand-brown/50">
            La sesión se cierra sola a las{' '}
            {new Date(session.sessionEndsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}{' '}
            (fin del turno).
          </p>
        )}
      </main>
    </div>
  );
}
