'use client';

import { useForm } from 'react-hook-form';
import { SITE } from '@/lib/constants';
import { MEMBERSHIP_TIERS } from '@/lib/memberships';
import { buildMembershipMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import Button from '@/components/shared/Button';

interface MembershipFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  membresia: string;
  empresa?: string;
  mensaje?: string;
}

interface MembershipInquiryFormProps {
  defaultMembership?: string;
}

export default function MembershipInquiryForm({ defaultMembership = '' }: MembershipInquiryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MembershipFormData>({
    defaultValues: { membresia: defaultMembership },
  });

  const selected = watch('membresia') ?? '';
  const showEmpresa = selected.toLowerCase().includes('empresa');

  const onSubmit = (data: MembershipFormData) => {
    const message = buildMembershipMessage(data);
    const url = buildWhatsAppUrl(SITE.whatsappPrimary, message);
    window.open(url, '_blank');
  };

  const inputClass =
    'w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body focus:outline-none focus:border-brand-gold transition-colors';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <input {...register('nombre', { required: true })} placeholder="Nombre *" className={inputClass} />
          {errors.nombre && <p className="text-red-600 text-xs mt-1">Requerido</p>}
        </div>
        <div>
          <input {...register('apellido', { required: true })} placeholder="Apellido *" className={inputClass} />
          {errors.apellido && <p className="text-red-600 text-xs mt-1">Requerido</p>}
        </div>
      </div>
      <input {...register('email', { required: true })} type="email" placeholder="Email *" className={inputClass} />
      {errors.email && <p className="text-red-600 text-xs mt-1">Requerido</p>}
      <input {...register('telefono', { required: true })} placeholder="Teléfono / WhatsApp *" className={inputClass} />
      {errors.telefono && <p className="text-red-600 text-xs mt-1">Requerido</p>}

      <div>
        <select
          {...register('membresia', { required: true })}
          className={`${inputClass} ${!selected ? 'text-brand-dark/40' : ''}`}
        >
          <option value="">Membresía de interés *</option>
          {MEMBERSHIP_TIERS.map((tier) => (
            <option key={tier.id} value={tier.name}>
              {tier.name}
            </option>
          ))}
        </select>
        {errors.membresia && <p className="text-red-600 text-xs mt-1">Requerido</p>}
      </div>

      {showEmpresa && (
        <input {...register('empresa')} placeholder="Nombre de la empresa" className={inputClass} />
      )}

      <textarea
        {...register('mensaje')}
        placeholder="Mensaje (opcional)"
        rows={4}
        className={inputClass}
      />

      <Button type="submit" className="w-full md:w-auto">
        Consultar por WhatsApp
      </Button>
      <p className="text-sm text-brand-dark/50 font-body">
        Al enviar se abre WhatsApp con tu consulta lista para enviar a Aguas del Cerro.
      </p>
    </form>
  );
}
