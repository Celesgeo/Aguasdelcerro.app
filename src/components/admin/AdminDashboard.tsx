'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { MEMBERSHIP_TIERS, getMembershipById, type MembershipTierId } from '@/lib/memberships';
import type { MemberRecord } from '@/lib/members-store';

const inputClass =
  'w-full border border-brand-brown/15 bg-white px-3 py-2.5 text-sm text-brand-dark font-body focus:outline-none focus:border-brand-gold';

const emptyForm = {
  accessNumber: '',
  downloadCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  membershipId: 'regular' as MembershipTierId,
  totalExperiences: 25,
  remainingExperiences: 25,
  startDate: '2026-09-21',
  endDate: '2027-09-21',
};

export default function AdminDashboard() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/members');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar');
      setMembers(data.members);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay = `${m.accessNumber} ${m.downloadCode} ${m.firstName} ${m.lastName} ${m.membershipId}`.toLowerCase();
      return hay.includes(q);
    });
  }, [members, query]);

  const onMembershipChange = (id: MembershipTierId) => {
    const tier = getMembershipById(id);
    const total = tier?.experiences ?? 0;
    setForm((f) => ({
      ...f,
      membershipId: id,
      totalExperiences: total,
      remainingExperiences: total,
    }));
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || 'No se pudo crear');
      return;
    }
    setShowForm(false);
    setForm(emptyForm);
    await load();
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar socio ${name}?`)) return;
    const res = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || 'No se pudo eliminar');
      return;
    }
    await load();
  };

  return (
    <AdminShell title="Socios registrados">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-brand-dark/55 font-body">
            {members.length} socio{members.length === 1 ? '' : 's'} · gestión de membresías y experiencias
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, acceso o código…"
            className={`${inputClass} md:w-72`}
          />
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="bg-brand-gold text-brand-brown px-5 py-2.5 text-xs tracking-[0.2em] uppercase font-body"
          >
            {showForm ? 'Cancelar' : 'Nuevo socio'}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-700 font-body">{error}</p>}

      {showForm && (
        <form onSubmit={onCreate} className="mb-10 border border-brand-brown/15 bg-white p-6 grid gap-4 md:grid-cols-2">
          <h2 className="md:col-span-2 font-display text-2xl text-brand-brown">Alta de socio</h2>
          <input
            className={inputClass}
            placeholder="Nombre *"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Apellido *"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Nº acceso único (opcional, ej. ADC-0010)"
            value={form.accessNumber}
            onChange={(e) => setForm({ ...form, accessNumber: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Código descarga 5 dígitos (opcional)"
            value={form.downloadCode}
            onChange={(e) => setForm({ ...form, downloadCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
            maxLength={5}
          />
          <select
            className={inputClass}
            value={form.membershipId}
            onChange={(e) => onMembershipChange(e.target.value as MembershipTierId)}
          >
            {MEMBERSHIP_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className={inputClass}
            type="number"
            min={0}
            placeholder="Total experiencias"
            value={form.totalExperiences}
            onChange={(e) =>
              setForm({
                ...form,
                totalExperiences: Number(e.target.value),
                remainingExperiences: Number(e.target.value),
              })
            }
          />
          <input
            className={inputClass}
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
          <input
            className={inputClass}
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-brand-brown text-brand-cream px-6 py-3 text-xs tracking-[0.2em] uppercase font-body"
            >
              Guardar socio
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-brand-dark/50 font-body">Cargando socios…</p>
      ) : (
        <div className="overflow-x-auto border border-brand-brown/10 bg-white">
          <table className="w-full text-left text-sm font-body">
            <thead className="bg-brand-brown text-brand-cream text-xs tracking-[0.12em] uppercase">
              <tr>
                <th className="px-4 py-3">Acceso</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Membresía</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Disponibles</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const tier = getMembershipById(m.membershipId);
                return (
                  <tr key={m.id} className="border-t border-brand-brown/10">
                    <td className="px-4 py-3 font-medium text-brand-brown">{m.accessNumber}</td>
                    <td className="px-4 py-3">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-4 py-3">
                      {tier?.name
                        .replace('Membresía ', '')
                        .replace('Empresa Fundadora ', 'Emp. ')
                        .replace('Empresa Fundadora', 'Emp. Fundadora') ?? m.membershipId}
                    </td>
                    <td className="px-4 py-3 tracking-widest">{m.downloadCode}</td>
                    <td className="px-4 py-3">
                      {m.remainingExperiences}/{m.totalExperiences}
                    </td>
                    <td className="px-4 py-3 text-brand-dark/60">
                      {m.startDate} → {m.endDate}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <Link href={`/admin/socios/${m.id}`} className="text-brand-brown underline">
                        Gestionar
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(m.id, `${m.firstName} ${m.lastName}`)}
                        className="text-red-700 underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-dark/45">
                    No hay socios para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
