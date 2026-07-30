export const SITE = {
  name: 'Aguas del Cerro',
  tagline: 'Parque Térmico & Mirador Gastronómico',
  location: 'La Rioja, Argentina',
  email: 'info@aguasdelcerro.com.ar',
  domain: 'aguasdelcerro.com.ar',
  instagram: 'https://www.instagram.com/aguasdelcerro',
  whatsappPrimary: '543804910523',
  whatsappSecondary: '543804941981',
  mapsUrl: 'https://maps.app.goo.gl/aYV66QVLAFgYRHBB9?g_st=iw',
  inaugurationDate: '2026-09-21T00:00:00-03:00',
  coordinates: { lat: -29.345978, lng: -66.864471 },
} as const;

export const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/experiencias', label: 'Experiencias' },
  { href: '/termas', label: 'Parque Térmico' },
  { href: '/membresias', label: 'Membresías' },
  { href: '/gastronomia', label: 'Gastronomía' },
  { href: '/galeria', label: 'Galería' },
  { href: '/contacto', label: 'Contacto' },
  { href: '/reservas', label: 'Reservas' },
] as const;

export const EXPERIENCES = [
  { slug: 'relax', title: 'Relax', description: 'Silencio, agua tibia y aire de montaña para desconectar del mundo.' },
  { slug: 'naturaleza', title: 'Naturaleza', description: 'Paisajes riojanos que invitan a respirar profundo y reconectar.' },
  { slug: 'fotografia', title: 'Fotografía', description: 'Luz dorada, montañas y cielos que se vuelven recuerdo.' },
  { slug: 'senderismo', title: 'Senderismo', description: 'Caminos suaves entre cerros y valles de La Rioja.' },
  { slug: 'gastronomia', title: 'Gastronomía', description: 'Sabores regionales elevados a una experiencia contemplativa.' },
  { slug: 'atardeceres', title: 'Atardeceres', description: 'El cielo se tiñe de oro mientras el mirador se enciende.' },
  { slug: 'descanso', title: 'Descanso', description: 'Tiempo lento, bienestar y calma en cada detalle.' },
] as const;

export const TERMAS_BENEFITS = [
  { title: 'Bienestar natural', description: 'Aguas térmicas mineralizadas que envuelven el cuerpo con calor suave.' },
  { title: 'Conexión con la tierra', description: 'Piscinas integradas al paisaje, construidas con piedra local.' },
  { title: 'Desconexión consciente', description: 'Un espacio diseñado para bajar el ritmo y escuchar el silencio.' },
  { title: 'Experiencia sensorial', description: 'Vapor, montaña y cielo abierto en armonía.' },
] as const;

export const FAQ_ITEMS = [
  { q: '¿Qué incluye la experiencia?', a: 'Acceso al parque térmico, espacios de descanso y el mirador gastronómico según la reserva confirmada.' },
  { q: '¿Cómo reservo?', a: 'Completá el formulario de reservas o escribinos por WhatsApp. Te respondemos con disponibilidad.' },
  { q: '¿Dónde estamos ubicados?', a: 'En La Rioja, Argentina. Podés ver la ubicación exacta en la sección de mapa.' },
  { q: '¿Hay estacionamiento?', a: 'Sí, contamos con estacionamiento para visitantes.' },
] as const;

export const TIMELINE = [
  { year: '2024', title: 'El sueño', description: 'Nace la visión de un refugio donde agua, montaña y gastronomía conviven.' },
  { year: '2025', title: 'Construcción', description: 'Piletas de piedra natural y mirador integrados al paisaje riojano.' },
  { year: '2026', title: 'Inauguración', description: 'Abrimos las puertas a quienes buscan una experiencia inolvidable.' },
] as const;
