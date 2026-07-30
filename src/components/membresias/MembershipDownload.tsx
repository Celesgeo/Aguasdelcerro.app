'use client';

import { useState } from 'react';
import Button from '@/components/shared/Button';

interface MembershipCardData {
  memberNumber: string;
  membershipName: string;
  firstName: string;
  lastName: string;
  startDate: string;
  endDate: string;
  experiences: number | null;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function loadLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar el logo'));
    img.src = '/images/logo.png';
  });
}

async function drawMembershipCard(card: MembershipCardData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const bg = ctx.createLinearGradient(0, 0, 1200, 750);
  bg.addColorStop(0, '#4b220c');
  bg.addColorStop(1, '#2a1408');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 750);

  ctx.strokeStyle = '#d7b56d';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, 1120, 670);
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, 1090, 640);

  try {
    const logo = await loadLogo();
    const logoSize = 150;
    ctx.drawImage(logo, 90, 80, logoSize, logoSize);
  } catch {
    // Si falla el logo, el carnet igual se genera con texto
  }

  ctx.fillStyle = '#d7b56d';
  ctx.font = '28px Georgia, serif';
  ctx.fillText('AGUAS DEL CERRO', 270, 130);

  ctx.fillStyle = 'rgba(248,245,239,0.7)';
  ctx.font = '18px sans-serif';
  ctx.fillText('PARQUE TÉRMICO & MIRADOR GASTRONÓMICO', 270, 165);

  ctx.fillStyle = '#f8f5ef';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('CARNET DE SOCIO', 90, 280);

  ctx.fillStyle = '#d7b56d';
  ctx.font = '26px Georgia, serif';
  ctx.fillText(card.membershipName.toUpperCase(), 90, 330);

  const rows: Array<[string, string]> = [
    ['Socio / Socia', `${card.firstName} ${card.lastName}`],
    ['Nº de socio', card.memberNumber],
    ['Vigencia', `${formatDate(card.startDate)} — ${formatDate(card.endDate)}`],
  ];
  if (card.experiences) {
    rows.push(['Experiencias', String(card.experiences)]);
  }

  let y = 400;
  for (const [label, value] of rows) {
    ctx.fillStyle = 'rgba(248,245,239,0.55)';
    ctx.font = '16px sans-serif';
    ctx.fillText(label.toUpperCase(), 90, y);
    ctx.fillStyle = '#f8f5ef';
    ctx.font = '32px Georgia, serif';
    ctx.fillText(value, 90, y + 40);
    y += 75;
  }

  ctx.fillStyle = 'rgba(215,181,109,0.7)';
  ctx.font = '14px sans-serif';
  ctx.fillText('La Rioja, Argentina · Documento emitido por Aguas del Cerro', 90, 690);

  return canvas;
}

export default function MembershipDownload() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [card, setCard] = useState<MembershipCardData | null>(null);

  const inputClass =
    'w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body tracking-[0.35em] text-center text-lg focus:outline-none focus:border-brand-gold transition-colors';

  const verify = async () => {
    setError(null);
    setCard(null);
    setLoading(true);
    try {
      const res = await fetch('/api/memberships/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'No se pudo validar el código.');
        return;
      }
      setCard(data.card as MembershipCardData);
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!card) return;
    setDownloading(true);
    setError(null);
    try {
      const canvas = await drawMembershipCard(card);
      const link = document.createElement('a');
      link.download = `membresia-${card.memberNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      setError('No se pudo generar el carnet. Intentá de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <label className="mb-2 block text-xs tracking-[0.2em] uppercase text-brand-dark/50 font-body">
          Código de habilitación (5 dígitos)
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="•••••"
          inputMode="numeric"
          maxLength={5}
          className={inputClass}
        />
      </div>

      <Button type="button" onClick={verify} className="w-full" disabled={loading || code.length !== 5}>
        {loading ? 'Validando…' : 'Validar código'}
      </Button>

      {error && <p className="text-sm text-red-700 font-body text-center">{error}</p>}

      {card && (
        <div className="border border-brand-gold/30 bg-brand-brown p-8 text-brand-cream space-y-4">
          <p className="text-xs tracking-[0.25em] uppercase text-brand-gold font-body">Carnet listo</p>
          <p className="font-display text-3xl">
            {card.firstName} {card.lastName}
          </p>
          <div className="grid gap-2 text-sm font-body text-brand-cream/80">
            <p>
              <span className="text-brand-gold">Membresía:</span> {card.membershipName}
            </p>
            <p>
              <span className="text-brand-gold">Nº socio:</span> {card.memberNumber}
            </p>
            <p>
              <span className="text-brand-gold">Vigencia:</span> {formatDate(card.startDate)} —{' '}
              {formatDate(card.endDate)}
            </p>
            {card.experiences ? (
              <p>
                <span className="text-brand-gold">Experiencias:</span> {card.experiences}
              </p>
            ) : null}
          </div>
          <Button type="button" onClick={() => void download()} className="w-full mt-4" disabled={downloading}>
            {downloading ? 'Generando…' : 'Descargar membresía'}
          </Button>
        </div>
      )}

      <p className="text-xs text-brand-dark/45 font-body text-center leading-relaxed">
        El código de 5 dígitos lo emite Aguas del Cerro una vez confirmada tu membresía. Sin ese código no se
        habilita la descarga.
      </p>
    </div>
  );
}
