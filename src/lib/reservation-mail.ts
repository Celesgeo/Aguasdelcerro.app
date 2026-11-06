import { SITE } from '@/lib/constants';
import { formatARS } from '@/lib/memberships';
import { getReservationsNotifyEmail, sendTransactionalEmail } from '@/lib/mail';
import { rescheduleDeadline, type Reservation } from '@/lib/reservations';
import { getSiteUrl } from '@/lib/site-url';
import { getVisitorShift } from '@/lib/visitor-shifts';

const TZ = 'America/Argentina/Buenos_Aires';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** "sábado 21/11/2026" */
export function formatVisitDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
  return `${weekday} ${pad(d)}/${pad(m)}/${y}`;
}

/** "Mañana · 8 a 12 hs" */
export function formatShift(shiftId: Reservation['shiftId']): string {
  const shift = getVisitorShift(shiftId);
  const names: Record<string, string> = { manana: 'Mañana', siesta: 'Siesta', tarde: 'Tarde', noche: 'Noche' };
  return `${names[shift.id]} · ${pad(shift.startHour)} a ${pad(shift.endHour)} hs`;
}

/** Regla de ingreso del turno, en una frase. */
export function entryRule(shiftId: Reservation['shiftId']): string {
  const shift = getVisitorShift(shiftId);
  return `Podés ingresar entre las ${pad(shift.startHour)} y las ${pad(shift.endHour)} hs. Después de las ${pad(shift.endHour)} hs no se permite el ingreso con esta reserva.`;
}

function formatDeadline(reservation: Reservation): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(rescheduleDeadline(reservation));
}

function manageUrl(reservation: Reservation): string {
  return `${getSiteUrl()}/mi-reserva?code=${encodeURIComponent(reservation.code)}`;
}

function people(quantity: number): string {
  return `${quantity} ${quantity === 1 ? 'persona' : 'personas'}`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#8a7a5c;font-size:13px;width:150px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#2b2118;font-size:15px">${escapeHtml(value)}</td></tr>`;
}

function layout(title: string, inner: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f1e7;font-family:Georgia,'Times New Roman',serif;color:#2b2118">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3d6bd">
<tr><td style="padding:28px 28px 8px"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a8894f">${escapeHtml(SITE.name)}</p>
<h1 style="margin:10px 0 0;font-size:26px;font-weight:normal;color:#4a3524">${escapeHtml(title)}</h1></td></tr>
<tr><td style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55">${inner}</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a7a5c">${escapeHtml(SITE.name)} · ${escapeHtml(SITE.location)} · <a href="${SITE.mapsUrl}" style="color:#8a7a5c">Cómo llegar</a> · WhatsApp +${SITE.whatsappPrimary}</p>
</td></tr></table></body></html>`;
}

function customerEmail(reservation: Reservation, kind: 'confirmed' | 'rescheduled') {
  const title = kind === 'confirmed' ? 'Tu reserva está confirmada' : 'Cambiaste tu reserva';
  const intro =
    kind === 'confirmed'
      ? `Hola ${reservation.name}, recibimos tu pago. Te esperamos.`
      : `Hola ${reservation.name}, tu reserva quedó con el nuevo día y turno.`;
  const date = formatVisitDate(reservation.date);
  const shift = formatShift(reservation.shiftId);
  const url = manageUrl(reservation);

  const html = layout(
    title,
    `<p style="margin:0 0 16px">${escapeHtml(intro)}</p>
<p style="margin:0 0 6px;font-size:13px;color:#8a7a5c">Código de reserva</p>
<p style="margin:0 0 18px;font-size:28px;letter-spacing:2px;font-family:'Courier New',monospace;color:#4a3524">${escapeHtml(reservation.code)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #efe6d4;border-bottom:1px solid #efe6d4;margin-bottom:18px">
${row('Día', date)}
${row('Turno', shift)}
${row('Personas', people(reservation.quantity))}
${row('Membresía', 'Visitante individual')}
${kind === 'confirmed' ? row('Total pagado', formatARS(reservation.total)) : ''}
</table>
<p style="margin:0 0 6px"><strong>Ingreso:</strong> ${escapeHtml(entryRule(reservation.shiftId))}</p>
<p style="margin:0 0 6px"><strong>En la entrada:</strong> mostrá este correo o decí tu código de reserva.</p>
<p style="margin:0 0 6px"><strong>Qué traer:</strong> traje de baño. Hay batas en alquiler, baños y vestuarios en el lugar.</p>
<p style="margin:0 0 6px"><strong>Menores:</strong> pagan desde los 10 años y siempre ingresan con un adulto responsable.</p>
<p style="margin:0 0 18px"><strong>Gastronomía y estacionamiento:</strong> hay gastronomía en el lugar (se paga aparte) y estacionamiento.</p>
<p style="margin:0 0 8px">¿Necesitás cambiar el día o el turno? Podés hacerlo vos hasta el <strong>${escapeHtml(formatDeadline(reservation))} hs</strong> (48 horas antes de tu turno).</p>
<p style="margin:0 0 4px"><a href="${url}" style="display:inline-block;background:#4a3524;color:#ffffff;text-decoration:none;padding:12px 22px;font-size:13px;letter-spacing:1px;text-transform:uppercase">Ver o cambiar mi reserva</a></p>
<p style="margin:16px 0 0;font-size:12px;color:#8a7a5c">El parque funciona con cualquier clima. Los cambios por lluvia o frío siguen la misma regla de 48 horas.</p>`,
  );

  const text = [
    `${title} · ${SITE.name}`,
    '',
    intro,
    '',
    `Código de reserva: ${reservation.code}`,
    `Día: ${date}`,
    `Turno: ${shift}`,
    `Personas: ${people(reservation.quantity)}`,
    'Membresía: Visitante individual',
    ...(kind === 'confirmed' ? [`Total pagado: ${formatARS(reservation.total)}`] : []),
    '',
    `Ingreso: ${entryRule(reservation.shiftId)}`,
    'En la entrada: mostrá este correo o decí tu código de reserva.',
    'Qué traer: traje de baño. Hay batas en alquiler, baños y vestuarios en el lugar.',
    'Menores: pagan desde los 10 años y siempre ingresan con un adulto responsable.',
    'Hay gastronomía (se paga aparte) y estacionamiento.',
    '',
    `Podés cambiar el día o el turno hasta el ${formatDeadline(reservation)} hs (48 horas antes): ${url}`,
    'El parque funciona con cualquier clima. Los cambios por lluvia o frío siguen la misma regla de 48 horas.',
    '',
    `Cómo llegar: ${SITE.mapsUrl}`,
    `WhatsApp: +${SITE.whatsappPrimary}`,
  ].join('\n');

  return { subject: `${title} · ${reservation.code} · ${date}`, html, text };
}

function staffEmail(reservation: Reservation, kind: 'confirmed' | 'rescheduled', previous?: { date: string; shiftId: Reservation['shiftId'] }) {
  const date = formatVisitDate(reservation.date);
  const shift = formatShift(reservation.shiftId);
  const title = kind === 'confirmed' ? 'Nueva reserva pagada' : 'Reserva cambiada por el cliente';
  const lines: Array<[string, string]> = [
    ['Código', reservation.code],
    ['Nombre', reservation.name],
    ['Correo', reservation.email],
    ['Teléfono', reservation.phone ?? '—'],
    ['Día', date],
    ['Turno', shift],
    ['Personas', people(reservation.quantity)],
    ['Total', formatARS(reservation.total)],
    ['Pago Mercado Pago', reservation.mpPaymentId ?? '—'],
  ];
  if (previous) {
    lines.push(['Antes era', `${formatVisitDate(previous.date)} · ${formatShift(previous.shiftId)}`]);
  }
  const html = layout(
    title,
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${lines.map(([l, v]) => row(l, v)).join('')}</table>`,
  );
  const text = [title, '', ...lines.map(([l, v]) => `${l}: ${v}`)].join('\n');
  return { subject: `${title}: ${reservation.code} · ${date} · ${people(reservation.quantity)}`, html, text };
}

/** Manda la confirmación al cliente y una copia a Aguas del Cerro. Devuelve si el cliente la recibió. */
export async function sendReservationConfirmedEmails(reservation: Reservation): Promise<boolean> {
  const customer = customerEmail(reservation, 'confirmed');
  let customerOk = false;
  try {
    await sendTransactionalEmail({ to: reservation.email, ...customer, replyTo: SITE.email });
    customerOk = true;
  } catch (error) {
    console.error(`[reservas] no se pudo enviar la confirmación de ${reservation.code}:`, error);
  }

  const staff = staffEmail(reservation, 'confirmed');
  try {
    await sendTransactionalEmail({ to: getReservationsNotifyEmail(), ...staff, replyTo: reservation.email });
  } catch (error) {
    console.error(`[reservas] no se pudo enviar la copia interna de ${reservation.code}:`, error);
  }
  return customerOk;
}

export async function sendReservationRescheduledEmails(
  reservation: Reservation,
  previous: { date: string; shiftId: Reservation['shiftId'] },
): Promise<void> {
  const customer = customerEmail(reservation, 'rescheduled');
  const staff = staffEmail(reservation, 'rescheduled', previous);
  await Promise.allSettled([
    sendTransactionalEmail({ to: reservation.email, ...customer, replyTo: SITE.email }),
    sendTransactionalEmail({ to: getReservationsNotifyEmail(), ...staff, replyTo: reservation.email }),
  ]).then((results) => {
    results.forEach((result) => {
      if (result.status === 'rejected') console.error(`[reservas] correo de cambio ${reservation.code}:`, result.reason);
    });
  });
}
