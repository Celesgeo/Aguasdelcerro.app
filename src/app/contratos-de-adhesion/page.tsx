import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import { LEGAL, SITE } from '@/lib/constants';
import { formatARS, TICKET_PRICE_ARS } from '@/lib/memberships';
import { REFUND_POLICY_MIN_HOURS, WITHDRAWAL_DAYS, WITHDRAWAL_MIN_HOURS } from '@/lib/reservations';
import { RESCHEDULE_MIN_HOURS, VISITOR_SHIFTS } from '@/lib/visitor-shifts';

export const metadata: Metadata = {
  title: 'Contratos de adhesión - Ley N° 24.240 de Defensa del Consumidor',
  description: 'Términos y condiciones de la membresía visitante individual de Aguas del Cerro.',
  alternates: { canonical: '/contratos-de-adhesion' },
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function ContratosDeAdhesionPage() {
  const whatsapp = `+${SITE.whatsappPrimary.slice(0, 2)} ${SITE.whatsappPrimary.slice(2, 5)} ${SITE.whatsappPrimary.slice(5)}`;

  return (
    <LegalPage
      eyebrow="Ley N° 24.240 de Defensa del Consumidor"
      title="Contrato de adhesión · Membresía visitante individual"
      updated={formatDate(LEGAL.termsEffectiveDate)}
    >
      <p>
        Este documento es el modelo del contrato que se celebra al adquirir una membresía visitante individual en
        este sitio. Puede leerlo, descargarlo o imprimirlo antes de contratar y en cualquier momento posterior. Una
        copia también se envía por correo electrónico junto con la confirmación de cada reserva.
      </p>

      <LegalSection title="1. Proveedor">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Nombre comercial: <strong>{SITE.name}</strong>
          </li>
          <li>Razón social: {LEGAL.businessName}</li>
          <li>CUIT: {LEGAL.cuit}</li>
          <li>Domicilio: {LEGAL.address}</li>
          <li>
            Correo electrónico de atención: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>
          </li>
          <li>WhatsApp: {whatsapp}</li>
          <li>Horario de atención: {LEGAL.supportHours}</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Objeto">
        <p>
          La membresía visitante individual otorga <strong>un ingreso por persona</strong> al predio de {SITE.name},
          en la fecha y el turno seleccionados al momento de la compra. Incluye el acceso al predio y a las piletas
          habilitadas, sanitarios, vestuarios y estacionamiento. La propuesta gastronómica y el alquiler de batas son
          servicios adicionales, que se abonan por separado en el lugar.
        </p>
        <p>
          Por el momento se encuentra habilitado un sector de piletas; el resto se incorporará progresivamente. Es un
          pago único: no constituye una suscripción ni se renueva.
        </p>
      </LegalSection>

      <LegalSection title="3. Precio y forma de pago">
        <p>
          El precio es de <strong>{formatARS(TICKET_PRICE_ARS)} por persona</strong>, expresado en pesos argentinos.
          Es el precio final e incluye todos los impuestos.
          {LEGAL.ticketPriceWithoutNationalTaxes !== null
            ? ` Precio sin impuestos nacionales: ${formatARS(LEGAL.ticketPriceWithoutNationalTaxes)}.`
            : ''}
        </p>
        <p>
          El pago se realiza en línea a través de Mercado Pago. {SITE.name} no accede a los datos de la tarjeta ni de
          la cuenta del cliente. Mientras se completa el pago, el lugar queda reservado durante 30 minutos; si el pago
          no se aprueba en ese plazo, el lugar se libera sin cargo alguno.
        </p>
        <p>
          El contrato queda perfeccionado cuando Mercado Pago aprueba el pago. En ese momento se envía al correo
          informado la confirmación con el código de reserva, la fecha, el turno y la cantidad de personas.
        </p>
      </LegalSection>

      <LegalSection title="4. Turnos y condiciones de ingreso">
        <ul className="list-disc space-y-1 pl-5">
          {VISITOR_SHIFTS.map((shift) => (
            <li key={shift.id}>
              {shift.name}: {shift.hours}
            </li>
          ))}
        </ul>
        <p>
          El ingreso se realiza dentro del horario del turno elegido, presentando el correo de confirmación o
          indicando el código de reserva.
        </p>
        <p>
          Los menores abonan a partir de los 10 años y deben asistir con la supervisión de un adulto responsable. Es
          necesario asistir con traje de baño. Durante la estadía deben respetarse las indicaciones del personal y las
          normas de seguridad y convivencia del parque. El parque funciona con cualquier clima.
        </p>
      </LegalSection>

      <LegalSection title="5. Cambios de fecha o turno">
        <p>
          La fecha o el turno pueden modificarse sin costo, hasta {RESCHEDULE_MIN_HOURS} horas antes del inicio del
          turno reservado, desde la sección <Link href="/mi-reserva">Mi reserva</Link>, sujeto a disponibilidad. El
          nuevo turno también debe comenzar con al menos {RESCHEDULE_MIN_HOURS} horas de anticipación.
        </p>
      </LegalSection>

      <LegalSection title="6. Cancelación, devoluciones y derecho de arrepentimiento">
        <p>
          <strong>Derecho de arrepentimiento.</strong> Conforme al artículo 34 de la Ley N° 24.240, los artículos
          1110 y siguientes del Código Civil y Comercial de la Nación y la Disposición N° 954/2025, el consumidor
          puede revocar la contratación dentro de los {WITHDRAWAL_DAYS} días corridos contados desde que recibe la
          confirmación con el comprobante de pago, siempre que lo notifique con al menos {WITHDRAWAL_MIN_HOURS} horas de
          anticipación al inicio del turno y que no haya utilizado el servicio. Puede ejercerlo sin registro previo
          desde el <Link href="/arrepentimiento">BOTÓN DE ARREPENTIMIENTO</Link>. La revocación no tiene costo para el
          consumidor.
        </p>
        <p>
          <strong>Cancelación anticipada.</strong> Además, con independencia del plazo anterior, el cliente puede
          cancelar su reserva y obtener la devolución total hasta {REFUND_POLICY_MIN_HOURS} horas antes del inicio del
          turno, desde el mismo botón.
        </p>
        <p>
          <strong>Fuera de esos plazos</strong> no corresponde la devolución. {SITE.name} podrá, a su criterio y según
          disponibilidad, ofrecer una nueva fecha.
        </p>
        <p>
          <strong>Cancelación por parte del parque.</strong> Si {SITE.name} no pudiera prestar el servicio en la fecha
          y el turno reservados por causas propias, el cliente podrá elegir entre una nueva fecha o la devolución total.
        </p>
        <p>
          Las devoluciones se realizan por el total abonado y al mismo medio de pago utilizado. Con tarjeta de crédito
          o débito, la entidad emisora puede demorar entre 2 y 35 días en reflejarla; con dinero en cuenta de Mercado
          Pago, se acredita en el momento. Toda solicitud recibe un código de trámite dentro de las 24 horas.
        </p>
      </LegalSection>

      <LegalSection title="7. Botón de baja de servicio">
        <p>
          La baja de la reserva puede solicitarse por el mismo medio por el que se contrató, sin registro previo,
          desde el <Link href="/arrepentimiento?tipo=baja">BOTÓN DE BAJA DE SERVICIO</Link>. La devolución, cuando
          corresponda, se rige por la cláusula 6.
        </p>
      </LegalSection>

      <LegalSection title="8. Datos personales">
        <p>
          Los datos informados se tratan conforme a la Ley N° 25.326 de Protección de los Datos Personales, según se
          detalla en la <Link href="/privacidad">Política de privacidad</Link>.
        </p>
      </LegalSection>

      <LegalSection title="9. Atención al cliente y reclamos">
        <p>
          Consultas y reclamos: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> o WhatsApp{' '}
          {whatsapp}, {LEGAL.supportHours}. Sin perjuicio de ello, el consumidor puede presentar su reclamo ante la
          autoridad de aplicación de la Ley N° 24.240 de su jurisdicción.
        </p>
      </LegalSection>

      <LegalSection title="10. Jurisdicción y ley aplicable">
        <p>
          Este contrato se rige por las leyes de la República Argentina. Para cualquier controversia será competente
          el tribunal correspondiente al domicilio real del consumidor.
        </p>
      </LegalSection>

      <LegalSection title="11. Vigencia y modificaciones">
        <p>
          La aceptación de estas condiciones se presta en forma expresa al marcar la casilla correspondiente antes de
          pagar; la sola navegación por el sitio no implica aceptación. Cualquier modificación futura se publicará en
          esta página con su fecha de vigencia y solo se aplicará a las contrataciones posteriores a esa fecha.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
