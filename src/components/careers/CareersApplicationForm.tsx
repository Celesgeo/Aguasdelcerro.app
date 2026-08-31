'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import Button from '@/components/shared/Button';
import {
  CAREERS_POSITIONS,
  CV_ALLOWED_EXTENSIONS,
  CV_MAX_BYTES,
  getFileExtension,
  isAllowedCvExtension,
} from '@/lib/careers';

interface CareersFormData {
  nombre: string;
  telefono: string;
  email: string;
  localidad: string;
  puesto: string;
  presentacion: string;
  _gotcha?: string;
}

function formatAllowedFormats(): string {
  return CV_ALLOWED_EXTENSIONS.map((ext) => ext.replace('.', '').toUpperCase()).join(', ');
}

function validateCvFile(file: File | undefined): string | true {
  if (!file || file.size === 0) return 'Adjuntá tu CV';
  if (file.size > CV_MAX_BYTES) return 'El archivo supera el límite de 5 MB';

  const ext = getFileExtension(file.name);
  if (!isAllowedCvExtension(ext)) {
    return `Formato no permitido. Usá ${formatAllowedFormats()}.`;
  }

  return true;
}

function CareersFormFields({ onSuccess }: { onSuccess: (message: string) => void }) {
  const [startedAt] = useState(() => Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CareersFormData>();

  const inputClass =
    'w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body focus:outline-none focus:border-brand-gold transition-colors';

  const onCvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCvFile(null);
      setCvError(null);
      return;
    }

    const validation = validateCvFile(file);
    if (validation !== true) {
      setCvFile(null);
      setCvError(validation);
      event.target.value = '';
      return;
    }

    setCvFile(file);
    setCvError(null);
  };

  const onSubmit = async (data: CareersFormData) => {
    setSubmitError(null);

    const cvValidation = validateCvFile(cvFile ?? undefined);
    if (cvValidation !== true) {
      setCvError(cvValidation);
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.append('nombre', data.nombre);
      body.append('telefono', data.telefono);
      body.append('email', data.email);
      body.append('localidad', data.localidad);
      body.append('puesto', data.puesto);
      body.append('presentacion', data.presentacion);
      body.append('_gotcha', data._gotcha ?? '');
      body.append('_startedAt', String(startedAt));
      body.append('cv', cvFile!);

      const response = await fetch('/api/careers', { method: 'POST', body });
      const result = (await response.json()) as { ok: boolean; error?: string; message?: string };

      if (!response.ok || !result.ok) {
        setSubmitError(result.error ?? 'No se pudo enviar la postulación.');
        return;
      }

      onSuccess(
        result.message ??
          '¡Gracias! Recibimos tu postulación. Nos contactaremos si tu perfil encaja con la búsqueda.',
      );
    } catch {
      setSubmitError('Error de conexión. Verificá tu internet e intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto" noValidate>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
        {...register('_gotcha')}
      />

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nombre" className="sr-only">
            Nombre completo
          </label>
          <input
            id="nombre"
            {...register('nombre', { required: 'Requerido' })}
            placeholder="Nombre completo *"
            className={inputClass}
            autoComplete="name"
          />
          {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label htmlFor="telefono" className="sr-only">
            Teléfono
          </label>
          <input
            id="telefono"
            {...register('telefono', { required: 'Requerido' })}
            type="tel"
            placeholder="Teléfono / WhatsApp *"
            className={inputClass}
            autoComplete="tel"
          />
          {errors.telefono && <p className="text-red-600 text-xs mt-1">{errors.telefono.message}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            {...register('email', {
              required: 'Requerido',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            })}
            type="email"
            placeholder="Email *"
            className={inputClass}
            autoComplete="email"
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="localidad" className="sr-only">
            Localidad
          </label>
          <input
            id="localidad"
            {...register('localidad', { required: 'Requerido' })}
            placeholder="Localidad *"
            className={inputClass}
            autoComplete="address-level2"
          />
          {errors.localidad && <p className="text-red-600 text-xs mt-1">{errors.localidad.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="puesto" className="sr-only">
          Puesto
        </label>
        <select
          id="puesto"
          {...register('puesto', { required: 'Seleccioná un puesto' })}
          className={`${inputClass} text-brand-dark`}
          defaultValue=""
        >
          <option value="" disabled>
            Puesto al que te postulás *
          </option>
          {CAREERS_POSITIONS.map((position) => (
            <option key={position.value} value={position.value}>
              {position.label}
            </option>
          ))}
        </select>
        {errors.puesto && <p className="text-red-600 text-xs mt-1">{errors.puesto.message}</p>}
      </div>

      <div>
        <label htmlFor="presentacion" className="sr-only">
          Experiencia o presentación breve
        </label>
        <textarea
          id="presentacion"
          {...register('presentacion', {
            required: 'Contanos brevemente tu experiencia',
            minLength: { value: 20, message: 'Mínimo 20 caracteres' },
            maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
          })}
          placeholder="Experiencia o presentación breve *"
          rows={5}
          className={inputClass}
        />
        {errors.presentacion && (
          <p className="text-red-600 text-xs mt-1">{errors.presentacion.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="cv"
          className="flex flex-col sm:flex-row sm:items-center gap-3 w-full border border-dashed border-brand-brown/25 bg-white px-4 py-5 cursor-pointer hover:border-brand-gold/60 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-11 h-11 shrink-0 bg-brand-cream text-brand-brown">
            <FileUp size={20} strokeWidth={1.5} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-body text-brand-dark">
              {cvFile ? cvFile.name : 'Adjuntar CV *'}
            </span>
            <span className="block text-xs text-brand-dark/50 font-body mt-1">
              PDF, Word o imagen · Máx. 5 MB · {formatAllowedFormats()}
            </span>
          </span>
          <input
            ref={fileInputRef}
            id="cv"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onCvChange}
          />
        </label>
        {cvError && <p className="text-red-600 text-xs mt-1">{cvError}</p>}
      </div>

      {submitError && (
        <p className="text-red-600 text-sm font-body bg-red-50 border border-red-100 px-4 py-3" role="alert">
          {submitError}
        </p>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Enviando…
          </span>
        ) : (
          'Enviar postulación'
        )}
      </Button>

      <p className="text-sm text-brand-dark/50 font-body leading-relaxed">
        Tus datos se usan únicamente para evaluar tu postulación. Al enviar aceptás que nos contactemos por
        teléfono o email.
      </p>
    </form>
  );
}

export default function CareersApplicationForm() {
  const [formKey, setFormKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (successMessage) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10 px-6 bg-white border border-brand-gold/30">
        <CheckCircle2 className="mx-auto mb-6 text-brand-gold" size={48} strokeWidth={1.5} />
        <h3 className="font-display text-3xl text-brand-brown mb-4">Postulación enviada</h3>
        <p className="text-brand-dark/70 font-body leading-relaxed">{successMessage}</p>
        <Button
          type="button"
          className="mt-8"
          onClick={() => {
            setSuccessMessage(null);
            setFormKey((key) => key + 1);
          }}
        >
          Enviar otra postulación
        </Button>
      </div>
    );
  }

  return <CareersFormFields key={formKey} onSuccess={setSuccessMessage} />;
}
