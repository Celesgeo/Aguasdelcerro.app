'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { MEMBERSHIP_TIERS, getMembershipById, type MembershipTierId } from '@/lib/memberships';
import type { MemberRecord } from '@/lib/members-store';

const inputClass =
  'w-full border border-brand-brown/15 bg-white px-3 py-2.5 text-sm text-brand-dark font-body focus:outline-none focus:border-brand-gold';

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminMemberDetail() {
  const params = useParams<{ id: string }>();
  const [member, setMember] = useState<MemberRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState({
    date: todayDate(),
    time: nowTime(),
    experiencesUsed: 1,
    note: '',
  });

  const load = async () => {
    setError(null);
    const res = await fetch(`/api/admin/members/${params.id}`);
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || 'No encontrado');
      setMember(null);
      return;
    }
    setMember(data.member);
  };

  useEffect(() => {
    void load();
  }, [params.id]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessNumber: member.accessNumber,
          downloadCode: member.downloadCode,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email ?? '',
          phone: member.phone ?? '',
          membershipId: member.membershipId,
          totalExperiences: member.totalExperiences,
          remainingExperiences: member.remainingExperiences,
          startDate: member.startDate,
          endDate: member.endDate,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo guardar');
      setMember(data.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const onAddUsage = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setError(null);
    const res = await fetch(`/api/admin/members/${member.id}/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usage),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || 'No se pudo registrar');
      return;
    }
    setMember(data.member);
    setUsage({ date: todayDate(), time: nowTime(), experiencesUsed: 1, note: '' });
  };

  const onDeleteUsage = async (usageId: string) => {
    if (!member || !confirm('¿Eliminar este uso y devolver las experiencias?')) return;
    const res = await fetch(`/api/admin/members/${member.id}/usage`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usageId }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || 'No se pudo eliminar');
      return;
    }
    setMember(data.member);
  };

  if (!member && !error) {
    return (
      <AdminShell title="Socio">
        <p className="text-brand-dark/50 font-body">Cargando…</p>
      </AdminShell>
    );
  }

  if (!member) {
    return (
      <AdminShell title="Socio">
        <p className="text-red-700 font-body">{error}</p>
        <Link href="/admin" className="underline text-brand-brown">
          Volver
        </Link>
      </AdminShell>
    );
  }

  const tier = getMembershipById(member.membershipId);

  return (
    <AdminShell title={`${member.firstName} ${member.lastName}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/admin" className="text-sm text-brand-brown underline font-body">
          ← Volver al listado
        </Link>
        <p className="text-sm font-body text-brand-dark/55">
          {tier?.name} · {member.remainingExperiences}/{member.totalExperiences} disponibles
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-700 font-body">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={onSave} className="border border-brand-brown/15 bg-white p-6 space-y-4">
          <h2 className="font-display text-2xl text-brand-brown">Datos del socio</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className={inputClass}
              value={member.firstName}
              onChange={(e) => setMember({ ...member, firstName: e.target.value })}
              placeholder="Nombre"
              required
            />
            <input
              className={inputClass}
              value={member.lastName}
              onChange={(e) => setMember({ ...member, lastName: e.target.value })}
              placeholder="Apellido"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-brand-dark/45 mb-1 font-body">
              Nº único de acceso
            </label>
            <input
              className={inputClass}
              value={member.accessNumber}
              onChange={(e) => setMember({ ...member, accessNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.15em] text-brand-dark/45 mb-1 font-body">
              Código descarga (5 dígitos)
            </label>
            <input
              className={inputClass}
              value={member.downloadCode}
              onChange={(e) =>
                setMember({ ...member, downloadCode: e.target.value.replace(/\D/g, '').slice(0, 5) })
              }
              maxLength={5}
              required
            />
          </div>
          <select
            className={inputClass}
            value={member.membershipId}
            onChange={(e) => {
              const membershipId = e.target.value as MembershipTierId;
              const nextTier = getMembershipById(membershipId);
              setMember({
                ...member,
                membershipId,
                totalExperiences: nextTier?.experiences ?? member.totalExperiences,
              });
            }}
          >
            {MEMBERSHIP_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-brand-dark/45 mb-1 font-body">
                Total experiencias
              </label>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={member.totalExperiences}
                onChange={(e) => setMember({ ...member, totalExperiences: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-brand-dark/45 mb-1 font-body">
                Disponibles
              </label>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={member.remainingExperiences}
                onChange={(e) => setMember({ ...member, remainingExperiences: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className={inputClass}
              type="date"
              value={member.startDate}
              onChange={(e) => setMember({ ...member, startDate: e.target.value })}
            />
            <input
              className={inputClass}
              type="date"
              value={member.endDate}
              onChange={(e) => setMember({ ...member, endDate: e.target.value })}
            />
          </div>
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={member.email ?? ''}
            onChange={(e) => setMember({ ...member, email: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Teléfono"
            value={member.phone ?? ''}
            onChange={(e) => setMember({ ...member, phone: e.target.value })}
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-brown text-brand-cream px-6 py-3 text-xs tracking-[0.2em] uppercase font-body disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>

        <div className="space-y-6">
          <form onSubmit={onAddUsage} className="border border-brand-brown/15 bg-white p-6 space-y-4">
            <h2 className="font-display text-2xl text-brand-brown">Registrar uso</h2>
            <p className="text-sm text-brand-dark/55 font-body">
              Descuenta experiencias disponibles y guarda fecha y hora del día de uso.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <input
                className={inputClass}
                type="date"
                value={usage.date}
                onChange={(e) => setUsage({ ...usage, date: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="time"
                value={usage.time}
                onChange={(e) => setUsage({ ...usage, time: e.target.value })}
                required
              />
            </div>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={member.remainingExperiences || 1}
              value={usage.experiencesUsed}
              onChange={(e) => setUsage({ ...usage, experiencesUsed: Number(e.target.value) })}
              required
            />
            <input
              className={inputClass}
              placeholder="Nota (opcional)"
              value={usage.note}
              onChange={(e) => setUsage({ ...usage, note: e.target.value })}
            />
            <button
              type="submit"
              disabled={member.remainingExperiences <= 0}
              className="bg-brand-gold text-brand-brown px-6 py-3 text-xs tracking-[0.2em] uppercase font-body disabled:opacity-45"
            >
              Cargar uso del día
            </button>
          </form>

          <div className="border border-brand-brown/15 bg-white p-6">
            <h2 className="font-display text-2xl text-brand-brown mb-4">Historial de usos</h2>
            {member.usageHistory.length === 0 ? (
              <p className="text-sm text-brand-dark/45 font-body">Todavía no hay usos registrados.</p>
            ) : (
              <ul className="space-y-3">
                {member.usageHistory.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-start justify-between gap-3 border-b border-brand-brown/10 pb-3 text-sm font-body"
                  >
                    <div>
                      <p className="text-brand-brown font-medium">
                        {u.date} · {u.time}
                      </p>
                      <p className="text-brand-dark/60">
                        {u.experiencesUsed} experiencia{u.experiencesUsed === 1 ? '' : 's'}
                        {u.note ? ` — ${u.note}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteUsage(u.id)}
                      className="text-red-700 underline shrink-0"
                    >
                      Deshacer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
