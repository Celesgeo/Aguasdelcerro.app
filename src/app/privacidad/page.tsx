import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import { LEGAL, PROVIDER_NAME, SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Tratamiento de datos personales en Aguas del Cerro (Ley N° 25.326).',
  alternates: { canonical: '/privacidad' },
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function PrivacidadPage() {
  return (
    <LegalPage
      eyebrow="Ley N° 25.326 de Protección de los Datos Personales"
      title="Política de privacidad"
      updated={formatDate(LEGAL.termsEffectiveDate)}
    >
      <LegalSection title="Responsable de los datos">
        <p>
          El responsable de la base de datos es{' '}
          {[
            PROVIDER_NAME,
            LEGAL.cuit ? `CUIT ${LEGAL.cuit}` : '',
            LEGAL.address ? `con domicilio en ${LEGAL.address}` : '',
          ]
            .filter(Boolean)
            .join(', ')}
          {PROVIDER_NAME !== SITE.name ? `, que opera el sitio de ${SITE.name}` : ''}. Contacto:{' '}
          <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos recopilamos y para qué">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Reservas:</strong> nombre y apellido, correo electrónico, teléfono (opcional), fecha, turno y
            cantidad de personas. Se usan para gestionar la reserva, enviar la confirmación, permitir cambios y
            devoluciones y atender consultas.
          </li>
          <li>
            <strong>Pagos:</strong> los procesa Mercado Pago. Recibimos el número y el estado del pago, pero no los
            datos de la tarjeta ni de la cuenta.
          </li>
          <li>
            <strong>Arrepentimiento y bajas:</strong> los datos que se informan en esas solicitudes, para tramitarlas y
            dejar constancia.
          </li>
          <li>
            <strong>Postulaciones laborales:</strong> los datos y el currículum que se envían desde “Trabajá con
            nosotros”, únicamente para evaluar la postulación.
          </li>
          <li>
            <strong>Navegación:</strong> datos estadísticos anónimos de uso del sitio, mediante Google Analytics.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Datos obligatorios y consecuencias">
        <p>
          El nombre y el correo electrónico son necesarios para realizar una reserva: sin ellos no es posible enviar
          la confirmación ni gestionar cambios o devoluciones. El teléfono es opcional. Si los datos informados son
          inexactos, es posible que la confirmación no llegue o que no podamos identificar la reserva.
        </p>
      </LegalSection>

      <LegalSection title="Con quién se comparten">
        <p>
          No vendemos ni cedemos datos personales. Solo intervienen, por cuenta nuestra y para prestar el servicio:
          Mercado Pago (procesamiento de pagos), Railway (alojamiento del sitio y de la base de datos, con servidores
          en los Estados Unidos), los servicios de envío de correo electrónico (Resend y Google) y Google Analytics
          (estadísticas). Algunos de estos proveedores almacenan la información fuera de la Argentina.
        </p>
      </LegalSection>

      <LegalSection title="Conservación">
        <p>
          Los datos de reservas y pagos se conservan durante el tiempo necesario para prestar el servicio y cumplir
          obligaciones legales, contables e impositivas. Las postulaciones se conservan mientras dure el proceso de
          selección.
        </p>
      </LegalSection>

      <LegalSection title="Sus derechos">
        <p>
          Puede solicitar el acceso, la rectificación, la actualización o la supresión de sus datos escribiendo a{' '}
          <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>, indicando su nombre y el motivo de la
          solicitud.
        </p>
        <p>
          El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma
          gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto
          conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326. La AGENCIA DE ACCESO A LA
          INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender
          las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las
          normas vigentes en materia de protección de datos personales.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
