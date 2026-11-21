'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { STOCK_CATEGORIES } from '@/lib/stock-shared';
import type { StockMovement, StockProduct } from '@/lib/stock-store';
import { VISITOR_SHIFTS, shiftLabel, type VisitorShiftId } from '@/lib/visitor-shifts';

const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

type Tab = 'productos' | 'ventas' | 'clave';

type Draft = {
  name: string;
  category: string;
  unitPrice: string;
  tracked: boolean;
  quantity: string;
  lowAlert: string;
};

const EMPTY_DRAFT: Draft = { name: '', category: 'Bebidas', unitPrice: '', tracked: true, quantity: '0', lowAlert: '2' };

const input = 'border border-brand-brown/20 bg-white px-3 py-2 text-sm font-body w-full';
const btn = 'text-xs tracking-[0.15em] uppercase px-3 py-2 font-body disabled:opacity-40';

async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Error');
  return data as T;
}

export default function AdminStock() {
  const [tab, setTab] = useState<Tab>('productos');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = useCallback((message: string) => {
    setError(null);
    setNotice(message);
  }, []);
  const fail = useCallback((cause: unknown) => {
    setNotice(null);
    setError(cause instanceof Error ? cause.message : 'Error');
  }, []);

  return (
    <AdminShell title="Stock">
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ['productos', 'Productos y stock'],
            ['ventas', 'Ventas por turno'],
            ['clave', 'Clave del personal'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`${btn} border ${tab === id ? 'bg-brand-brown text-brand-cream border-brand-brown' : 'border-brand-brown/30 text-brand-brown'}`}
          >
            {label}
          </button>
        ))}
        <Link href="/stock" target="_blank" rel="noopener" className={`${btn} border border-brand-gold/50 text-brand-brown ml-auto`}>
          Abrir vista del turno ↗
        </Link>
      </div>

      {error && <p className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 p-3 font-body">{error}</p>}
      {notice && <p className="mb-4 text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 font-body">{notice}</p>}

      {tab === 'productos' && <ProductsTab onNotice={flash} onError={fail} />}
      {tab === 'ventas' && <SalesTab onNotice={flash} onError={fail} />}
      {tab === 'clave' && <PinTab onNotice={flash} onError={fail} />}
    </AdminShell>
  );
}

type TabProps = { onNotice: (m: string) => void; onError: (e: unknown) => void };

/* ============================== Productos ============================== */

function ProductsTab({ onNotice, onError }: TabProps) {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [restock, setRestock] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ products: StockProduct[] }>('/api/admin/stock/products');
      setProducts(data.products);
    } catch (cause) {
      onError(cause);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const toBody = (d: Draft) => ({
    name: d.name,
    category: d.category,
    unitPrice: Number(d.unitPrice || 0),
    tracked: d.tracked,
    quantity: d.tracked ? Number(d.quantity || 0) : undefined,
    lowAlert: Number(d.lowAlert || 0),
  });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('new');
    try {
      await api('/api/admin/stock/products', { method: 'POST', body: JSON.stringify(toBody(draft)) });
      onNotice(`Producto "${draft.name}" agregado.`);
      setDraft({ ...EMPTY_DRAFT, category: draft.category });
      await load();
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (p: StockProduct) => {
    setEditing(p.id);
    setEditDraft({
      name: p.name,
      category: p.category,
      unitPrice: String(p.unitPrice),
      tracked: p.quantity !== null,
      quantity: String(p.quantity ?? 0),
      lowAlert: String(p.lowAlert),
    });
  };

  const saveEdit = async (p: StockProduct) => {
    setBusy(p.id);
    try {
      const body: Record<string, unknown> = toBody(editDraft);
      // Si no tocaste la cantidad, no se manda: así no se pisan ventas hechas mientras editabas.
      if (editDraft.tracked && p.quantity !== null && Number(editDraft.quantity) === p.quantity) delete body.quantity;
      await api(`/api/admin/stock/products/${p.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      onNotice(`"${editDraft.name}" guardado.`);
      setEditing(null);
      await load();
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(null);
    }
  };

  const doRestock = async (p: StockProduct) => {
    const units = Number(restock[p.id] || 0);
    if (!Number.isInteger(units) || units < 1) return;
    setBusy(p.id);
    try {
      await api(`/api/admin/stock/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ restock: units }) });
      onNotice(`Se sumaron ${units} a ${p.name}.`);
      setRestock((r) => ({ ...r, [p.id]: '' }));
      await load();
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (p: StockProduct) => {
    if (p.active && !window.confirm(`¿Ocultar "${p.name}"? Deja de aparecer para el personal (las ventas quedan guardadas).`)) return;
    setBusy(p.id);
    try {
      await api(`/api/admin/stock/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ active: !p.active }) });
      onNotice(p.active ? `"${p.name}" oculto.` : `"${p.name}" visible otra vez.`);
      await load();
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(null);
    }
  };

  const grouped = useMemo(() => {
    const visible = products.filter((p) => showInactive || p.active);
    return STOCK_CATEGORIES.map((c) => [c, visible.filter((p) => p.category === c)] as const).filter(
      ([, items]) => items.length > 0,
    );
  }, [products, showInactive]);

  const stockValue = products
    .filter((p) => p.active && p.quantity !== null)
    .reduce((sum, p) => sum + (p.quantity ?? 0) * p.unitPrice, 0);

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="bg-white border border-brand-brown/10 p-5 space-y-4">
        <h2 className="font-display text-xl text-brand-brown">Agregar producto</h2>
        <DraftFields draft={draft} onChange={setDraft} />
        <button type="submit" disabled={busy === 'new' || !draft.name} className={`${btn} bg-brand-brown text-brand-cream`}>
          {busy === 'new' ? 'Guardando…' : 'Agregar'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 font-body text-sm text-brand-brown/80">
        <span>
          Valor del stock contado: <strong>{ARS.format(stockValue)}</strong>
        </span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar ocultos
        </label>
      </div>

      {loading && <p className="font-body text-brand-brown/60">Cargando…</p>}

      {grouped.map(([category, items]) => (
        <section key={category}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60 mb-2 font-body">{category}</h3>
          <div className="bg-white border border-brand-brown/10 divide-y divide-brand-brown/10">
            {items.map((p) =>
              editing === p.id ? (
                <div key={p.id} className="p-4 space-y-3 bg-brand-cream/40">
                  <DraftFields draft={editDraft} onChange={setEditDraft} />
                  <p className="text-xs text-brand-brown/60 font-body">
                    Cambiar la cantidad acá la reemplaza (queda registrado como ajuste). Para sumar mercadería usá “Reponer”.
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveEdit(p)} disabled={busy === p.id} className={`${btn} bg-brand-brown text-brand-cream`}>
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className={`${btn} border border-brand-brown/30 text-brand-brown`}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div key={p.id} className={`p-3 flex flex-wrap items-center gap-3 font-body ${p.active ? '' : 'opacity-50'}`}>
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-brand-dark">{p.name}</p>
                    <p className="text-sm text-brand-brown/80">
                      {p.unitPrice > 0 ? ARS.format(p.unitPrice) : <span className="text-red-700">Sin precio</span>}
                    </p>
                  </div>
                  <div className="w-28 text-sm">
                    {p.quantity === null ? (
                      <span className="text-brand-brown/60">Sin control</span>
                    ) : (
                      <span
                        className={
                          p.quantity === 0 ? 'text-red-700 font-semibold' : p.quantity <= p.lowAlert ? 'text-amber-700 font-semibold' : ''
                        }
                      >
                        {p.quantity} und
                      </span>
                    )}
                  </div>
                  {p.quantity !== null && p.active && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={restock[p.id] ?? ''}
                        onChange={(e) => setRestock((r) => ({ ...r, [p.id]: e.target.value }))}
                        placeholder="+"
                        className="w-16 border border-brand-brown/20 px-2 py-1.5 text-sm"
                        aria-label={`Unidades a reponer de ${p.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => doRestock(p)}
                        disabled={busy === p.id || !restock[p.id]}
                        className={`${btn} border border-emerald-700/40 text-emerald-800`}
                      >
                        Reponer
                      </button>
                    </div>
                  )}
                  <button type="button" onClick={() => startEdit(p)} className={`${btn} border border-brand-brown/30 text-brand-brown`}>
                    Editar
                  </button>
                  <button type="button" onClick={() => toggleActive(p)} disabled={busy === p.id} className={`${btn} text-brand-brown/70 underline`}>
                    {p.active ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function DraftFields({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 font-body text-sm">
      <label className="block">
        Nombre
        <input className={input} value={draft.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} />
      </label>
      <label className="block">
        Categoría
        <select className={input} value={draft.category} onChange={(e) => set({ category: e.target.value })}>
          {STOCK_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block">
        Precio ($)
        <input className={input} type="number" min={0} value={draft.unitPrice} onChange={(e) => set({ unitPrice: e.target.value })} />
      </label>
      <label className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
        <input type="checkbox" checked={draft.tracked} onChange={(e) => set({ tracked: e.target.checked })} />
        Controlar stock (contar unidades). Destildalo para cosas que se preparan en el momento, como licuados o tragos.
      </label>
      {draft.tracked && (
        <>
          <label className="block">
            Cantidad
            <input className={input} type="number" min={0} value={draft.quantity} onChange={(e) => set({ quantity: e.target.value })} />
          </label>
          <label className="block">
            Avisar cuando queden
            <input className={input} type="number" min={0} value={draft.lowAlert} onChange={(e) => set({ lowAlert: e.target.value })} />
          </label>
        </>
      )}
    </div>
  );
}

/* ============================== Ventas ============================== */

function SalesTab({ onNotice, onError }: TabProps) {
  const [date, setDate] = useState('');
  const [today, setToday] = useState('');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    async (next?: string) => {
      setLoading(true);
      try {
        const q = next ? `?date=${encodeURIComponent(next)}` : '';
        const data = await api<{ date: string; today: string; movements: StockMovement[] }>(`/api/admin/stock/movements${q}`);
        setDate(data.date);
        setToday(data.today);
        setMovements(data.movements);
      } catch (cause) {
        onError(cause);
      } finally {
        setLoading(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const sales = movements.filter((m) => m.kind === 'sale');
  const valid = sales.filter((m) => !m.voided);
  const others = movements.filter((m) => m.kind !== 'sale');

  const byShift = VISITOR_SHIFTS.map((s) => {
    const items = valid.filter((m) => m.shiftId === s.id);
    return { id: s.id as VisitorShiftId, units: items.reduce((n, m) => n + m.units, 0), total: items.reduce((n, m) => n + m.total, 0) };
  });

  const byProduct = useMemo(() => {
    const map = new Map<string, { name: string; units: number; total: number }>();
    for (const m of valid) {
      const row = map.get(m.productId) ?? { name: m.productName, units: 0, total: 0 };
      row.units += m.units;
      row.total += m.total;
      map.set(m.productId, row);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [valid]);

  const dayTotal = valid.reduce((n, m) => n + m.total, 0);

  const voidOne = async (m: StockMovement) => {
    if (!window.confirm(`¿Anular la venta de ${m.units} × ${m.productName} (${ARS.format(m.total)})? Las unidades vuelven al stock.`)) return;
    setBusy(m.id);
    try {
      await api(`/api/stock/sales/${m.id}`, { method: 'DELETE' });
      onNotice('Venta anulada.');
      await load(date);
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Jornada
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && load(e.target.value)} className={`${input} w-auto block`} />
        </label>
        <button type="button" onClick={() => load(date)} className={`${btn} border border-brand-brown/30 text-brand-brown`}>
          Actualizar
        </button>
        <p className="text-xs text-brand-brown/60 basis-full">
          La jornada empieza 07:30: lo vendido en la Noche después de medianoche y en la Madrugada cuenta para el día en que empezó.
        </p>
      </div>

      {loading ? (
        <p className="text-brand-brown/60">Cargando…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {byShift.map((s) => (
              <div key={s.id} className="bg-white border border-brand-brown/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-brand-brown/60">{shiftLabel(s.id).split(' · ')[0]}</p>
                <p className="font-display text-2xl text-brand-brown">{ARS.format(s.total)}</p>
                <p className="text-xs text-brand-brown/60">{s.units} unidades</p>
              </div>
            ))}
            <div className="bg-brand-brown text-brand-cream p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gold">Total del día</p>
              <p className="font-display text-2xl">{ARS.format(dayTotal)}</p>
              <p className="text-xs opacity-70">{valid.reduce((n, m) => n + m.units, 0)} unidades</p>
            </div>
          </div>

          {byProduct.length > 0 && (
            <section className="bg-white border border-brand-brown/10 p-4">
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60 mb-2">Por producto</h3>
              <table className="w-full text-sm">
                <tbody>
                  {byProduct.map((r) => (
                    <tr key={r.name} className="border-t border-brand-brown/10">
                      <td className="py-1.5">{r.name}</td>
                      <td className="py-1.5 text-right w-20">{r.units}</td>
                      <td className="py-1.5 text-right w-32">{ARS.format(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="bg-white border border-brand-brown/10 p-4">
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60 mb-2">Detalle de ventas</h3>
            {sales.length === 0 ? (
              <p className="text-sm text-brand-brown/60">No hay ventas en esta jornada.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-brand-brown/60">
                  <tr>
                    <th className="py-1">Hora</th>
                    <th>Turno</th>
                    <th>Producto</th>
                    <th>Vendió</th>
                    <th className="text-right">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sales.map((m) => (
                    <tr key={m.id} className={`border-t border-brand-brown/10 ${m.voided ? 'opacity-50 line-through' : ''}`}>
                      <td className="py-1.5">{new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{m.shiftId ? shiftLabel(m.shiftId as VisitorShiftId).split(' · ')[0] : '—'}</td>
                      <td>
                        {m.units} × {m.productName}
                      </td>
                      <td>{m.staffName}</td>
                      <td className="text-right">{ARS.format(m.total)}</td>
                      <td className="text-right">
                        {!m.voided && (
                          <button type="button" onClick={() => voidOne(m)} disabled={busy === m.id} className="text-xs text-red-700 underline">
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {others.length > 0 && (
            <section className="bg-white border border-brand-brown/10 p-4">
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-brand-brown/60 mb-2">Reposiciones y ajustes</h3>
              <ul className="text-sm divide-y divide-brand-brown/10">
                {others.map((m) => (
                  <li key={m.id} className="py-1.5 flex gap-3">
                    <span className="w-12 text-brand-brown/60">
                      {new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex-1">
                      {m.kind === 'restock' ? `+${m.units}` : m.units > 0 ? `+${m.units}` : m.units} {m.productName}
                      {m.note ? <span className="text-brand-brown/60"> · {m.note}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ============================== Clave del personal ============================== */

function PinTab({ onNotice, onError }: TabProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ configured: boolean }>('/api/admin/stock/pin')
      .then((d) => setConfigured(d.configured))
      .catch(onError);
  }, [onError]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/admin/stock/pin', { method: 'PUT', body: JSON.stringify({ pin }) });
      setConfigured(true);
      setPin('');
      onNotice('Clave del personal guardada. Las sesiones abiertas con la clave anterior se cerraron.');
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white border border-brand-brown/10 p-5 space-y-4 max-w-md font-body">
      <h2 className="font-display text-xl text-brand-brown">Clave del personal</h2>
      <p className="text-sm text-brand-brown/80">
        Es la clave que usan los empleados para entrar a <strong>/stock</strong> y vender en su turno. No da acceso a este panel.
        {configured === false && <span className="block mt-2 text-amber-800">Todavía no hay clave: el personal no puede entrar.</span>}
        {configured && <span className="block mt-2 text-emerald-800">Hay una clave activa. Si la cambiás, todos tienen que volver a ingresar.</span>}
      </p>
      <input
        type="password"
        autoComplete="new-password"
        autoCapitalize="none"
        spellCheck={false}
        value={pin}
        onChange={(e) => setPin(e.target.value.slice(0, 40))}
        placeholder="Entre 6 y 40 caracteres (distingue mayúsculas)"
        className={input}
      />
      <button type="submit" disabled={busy || pin.length < 6} className={`${btn} bg-brand-brown text-brand-cream`}>
        {busy ? 'Guardando…' : configured ? 'Cambiar clave' : 'Guardar clave'}
      </button>
    </form>
  );
}
