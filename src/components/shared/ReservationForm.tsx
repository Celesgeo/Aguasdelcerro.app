'use client';

import { useForm } from 'react-hook-form';
import { SITE } from '@/lib/constants';
import { buildReservationMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import Button from '@/components/shared/Button';

interface ReservationFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  personas: string;
  fecha: string;
  mensaje?: string;
}

export default function ReservationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ReservationFormData>();

  const onSubmit = (data: ReservationFormData) => {
    const message = buildReservationMessage(data);
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
      <input {...register('telefono', { required: true })} placeholder="Teléfono *" className={inputClass} />
      <div className="grid md:grid-cols-2 gap-6">
        <input {...register('personas', { required: true })} placeholder="Cantidad de personas *" className={inputClass} />
        <input {...register('fecha', { required: true })} type="date" className={inputClass} />
      </div>
      <textarea {...register('mensaje')} placeholder="Mensaje (opcional)" rows={4} className={inputClass} />
      <Button type="submit" className="w-full md:w-auto">Consultar disponibilidad</Button>
      <p className="text-sm text-brand-dark/50 font-body">
        Si no recibís respuesta, contactanos al{' '}
        <a href={`https://wa.me/${SITE.whatsappSecondary}`} className="text-brand-gold underline" target="_blank" rel="noopener noreferrer">
          +54 380 4941981
        </a>
      </p>
    </form>
  );
}
