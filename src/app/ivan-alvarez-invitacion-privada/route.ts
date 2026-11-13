import { SITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const PATH = '/ivan-alvarez-invitacion-privada';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BODY = `<style>
@font-face{font-family:'Cinzel';src:url(/invitacion-privada/fonts/cinzel.woff) format('woff');font-weight:400 900;font-display:swap}
@font-face{font-family:'Cormorant Garamond';src:url(/invitacion-privada/fonts/cormorant.woff) format('woff');font-weight:300 700;font-display:swap}
@font-face{font-family:'Cormorant Garamond';src:url(/invitacion-privada/fonts/cormorant-italic.woff) format('woff');font-weight:300 700;font-style:italic;font-display:swap}
@font-face{font-family:'Inter';src:url(/invitacion-privada/fonts/inter.woff) format('woff');font-weight:100 900;font-display:swap}
html{-webkit-text-size-adjust:100%}
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}img{max-width:100%}[hidden]{display:none!important}
/* Layout: una sola columna centrada estilo tarjeta impresa, en bloques que se recorren al deslizar; tapa que se abre al tocar. */
:root{
  --bg:#24130a;          /* chocolate */
  --bg-2:#2e190d;        /* bloque alterno */
  --ink:#f3ebdc;         /* marfil */
  --ink-soft:rgba(243,235,220,.74);
  --gold:#cfae72;        /* dorado mate */
  --gold-line:rgba(207,174,114,.45);
  --paper:#f8f3ea;
  --display:'Cinzel', 'Trajan Pro', Georgia, serif;
  --serif:'Cormorant Garamond', Garamond, Georgia, serif;
  --sans:'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color-scheme:dark;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.5;-webkit-font-smoothing:antialiased}
body.cerrado{overflow:hidden}
.wrap{max-width:560px;margin:0 auto;padding-left:max(20px, env(safe-area-inset-left, 0px));padding-right:max(20px, env(safe-area-inset-right, 0px))}
.label{font-family:var(--sans);font-size:12px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin:0}
.rule{height:1px;background:var(--gold-line);border:0;margin:0}
section{padding-block:72px;text-align:center}
section + section{border-top:1px solid var(--gold-line)}
h2{font-family:var(--display);font-weight:600;font-size:clamp(26px,7vw,34px);letter-spacing:.06em;margin:14px 0 0;text-wrap:balance}

/* Tapa */
.tapa{position:fixed;inset:0;z-index:20;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:26px;text-align:center;
  padding:calc(40px + env(safe-area-inset-top,0px)) max(24px, env(safe-area-inset-right,0px)) calc(40px + env(safe-area-inset-bottom,0px)) max(24px, env(safe-area-inset-left,0px));
  transition:transform 1.1s cubic-bezier(.7,0,.2,1), opacity .9s ease .3s}
.tapa::before{content:"";position:absolute;inset:16px;border:1px solid var(--gold-line);pointer-events:none}
.tapa::after{content:"";position:absolute;inset:24px;border:1px solid rgba(207,174,114,.2);pointer-events:none}
.tapa.abierta{transform:translateY(-100%);opacity:0;pointer-events:none}
.tapa img{width:min(240px,62vw);height:auto;position:relative;margin-top:4vh}
.tapa-pie{display:flex;flex-direction:column;align-items:center;gap:22px;margin-bottom:3vh}
.tapa > *{position:relative;z-index:1}
.tapa-foto{position:absolute!important;inset:0;z-index:0!important;background:var(--bg) url(/invitacion-privada/atardecer.jpg) 46% 40%/cover no-repeat;filter:saturate(.85) sepia(.12)}
.destello{position:absolute!important;left:46%;top:35%;width:0;height:0;z-index:3!important;pointer-events:none;opacity:0}
.destello::before{content:"";position:absolute;left:-60vmax;top:-60vmax;width:120vmax;height:120vmax;border-radius:50%;background:radial-gradient(circle,rgba(255,250,235,1) 0%,rgba(255,226,170,.85) 6%,rgba(240,190,110,.35) 18%,rgba(207,174,114,0) 42%);transform:scale(.15)}
.destello::after{content:"";position:absolute;left:-80vw;top:-2px;width:160vw;height:4px;background:linear-gradient(90deg,rgba(255,236,190,0),rgba(255,244,220,.9) 50%,rgba(255,236,190,0));filter:blur(1px);transform:scaleX(.1)}
.tapa.amaneciendo .destello{animation:destello 1.4s ease-out forwards}
.tapa.amaneciendo .destello::before{animation:halo 1.4s ease-out forwards}
.tapa.amaneciendo .destello::after{animation:rayo 1.4s ease-out forwards}
@keyframes destello{0%{opacity:0}25%{opacity:1}100%{opacity:1}}
@keyframes halo{0%{transform:scale(.1)}100%{transform:scale(1.6)}}
@keyframes rayo{0%{transform:scaleX(.1);opacity:0}30%{opacity:1}100%{transform:scaleX(1);opacity:.2}}
.tapa.amaneciendo .tapa-pie,.tapa.amaneciendo > img{opacity:0;transition:opacity .6s ease}
.tapa-foto::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(36,19,10,.78) 0%,rgba(36,19,10,.55) 22%,rgba(36,19,10,.2) 42%,rgba(36,19,10,.75) 68%,rgba(36,19,10,.96) 100%)}
.tapa::before,.tapa::after{z-index:2}
.para{display:flex;flex-direction:column;gap:6px;align-items:center}
.para strong{font-family:var(--serif);font-style:italic;font-weight:600;font-size:clamp(30px,8vw,40px);line-height:1.15;color:var(--ink)}
.abrir{appearance:none;border:1px solid var(--gold);background:transparent;color:var(--gold);font:600 13px/1 var(--sans);letter-spacing:.3em;text-transform:uppercase;padding:18px 30px;cursor:pointer;transition:background .25s,color .25s}
.abrir:hover,.abrir:focus-visible{background:var(--gold);color:var(--bg);outline:none}

/* Portada */
.portada{padding-top:64px;position:relative;isolation:isolate}
.portada::before{content:"";position:absolute;inset:0 0 auto;height:min(620px,120vw);z-index:-1;background:linear-gradient(180deg,rgba(36,19,10,.55) 0%,rgba(36,19,10,.7) 50%,var(--bg) 100%),url(/invitacion-privada/noche-lugar.jpg) center 40%/cover no-repeat;filter:saturate(.8)}
.portada img{width:min(300px,76vw);height:auto;display:block;margin:0 auto}
.frase{font-family:var(--serif);font-style:italic;font-weight:600;font-size:clamp(32px,8.6vw,44px);line-height:1.12;color:var(--gold);margin:44px 0 0;text-wrap:balance}
.texto{font-family:var(--serif);font-weight:500;font-size:clamp(21px,5.4vw,24px);line-height:1.45;color:var(--ink);max-width:30ch;margin:20px auto 0;text-wrap:pretty}
.firma{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:26px;font-family:var(--display);font-weight:600;font-size:19px;letter-spacing:.14em}
.firma::before,.firma::after{content:"";width:34px;height:1px;background:var(--gold)}

/* Fecha */
.fecha-dia{font-family:var(--serif);font-style:italic;font-size:26px;color:var(--ink-soft);margin:18px 0 0}
.fecha{display:inline-flex;align-items:center;gap:14px;margin-top:14px;padding:16px 28px;border:1px solid var(--gold);font-family:var(--display);font-weight:600;font-size:clamp(28px,8vw,36px);letter-spacing:.06em;font-variant-numeric:tabular-nums}
.fecha span{color:var(--gold);font-weight:500}
.hora{margin:14px 0 0;font-size:16px;color:var(--ink-soft);letter-spacing:.04em}
.cuenta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:36px auto 0;max-width:380px}
.cuenta div{display:flex;flex-direction:column;gap:4px;align-items:center}
.cuenta b{font-family:var(--display);font-weight:600;font-size:30px;font-variant-numeric:tabular-nums;line-height:1}
.cuenta small{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft)}
.cuenta-fin{margin:30px 0 0;font-family:var(--serif);font-style:italic;font-size:24px;color:var(--gold)}

/* Experiencia */
.alterno{background:var(--bg-2)}
.experiencia p.texto{max-width:32ch}
.experiencia{position:relative;isolation:isolate;padding-block:90px 300px}
.experiencia::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,var(--bg) 0%,rgba(36,19,10,.78) 20%,rgba(36,19,10,.55) 42%,rgba(36,19,10,.1) 62%,rgba(36,19,10,.25) 85%,var(--bg) 100%),url(/invitacion-privada/pileta-portada.jpg) center 70%/cover no-repeat;filter:saturate(.95)}

/* Detalles */
.detalles{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:34px;border-top:1px solid var(--gold-line);border-bottom:1px solid var(--gold-line)}
.detalle{display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px 10px}
.detalle + .detalle{border-left:1px solid var(--gold-line)}
.detalle p{margin:0;font-size:17px;line-height:1.35}
.detalle .label{letter-spacing:.2em;white-space:nowrap}
.detalle p span{display:block;color:var(--ink-soft);font-size:15px}
.circulos{display:flex;gap:8px;height:34px;align-items:center}
.circulos i{width:28px;height:28px;border-radius:50%;display:block}
.c1{background:#ffffff}.c2{background:#d9c6a3}.c3{background:#7a4524;box-shadow:inset 0 0 0 1.5px rgba(243,235,220,.6)}
.icono{width:46px;height:34px;display:block}
@media (max-width:380px){.detalles{grid-template-columns:1fr}.detalle + .detalle{border-left:0;border-top:1px solid var(--gold-line)}}

/* Ubicación */
.lugar{font-family:var(--serif);font-size:26px;line-height:1.3;margin:18px 0 0}
.lugar em{display:block;color:var(--ink-soft);font-size:20px}
.boton{display:inline-flex;align-items:center;justify-content:center;gap:10px;margin-top:28px;padding:17px 30px;border:1px solid var(--gold);color:var(--gold);text-decoration:none;font:600 13px/1 var(--sans);letter-spacing:.26em;text-transform:uppercase;transition:background .25s,color .25s}
.boton:hover,.boton:focus-visible{background:var(--gold);color:var(--bg);outline:none}
.boton.lleno{background:var(--gold);color:var(--bg)}
.boton.lleno:hover,.boton.lleno:focus-visible{background:var(--ink);border-color:var(--ink)}

/* Confirmación */
form{margin:30px auto 0;max-width:420px;display:flex;flex-direction:column;gap:22px;text-align:left}
.campo{display:flex;flex-direction:column;gap:8px}
.campo > label,.campo legend{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);padding:0}
fieldset{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
input[type=text],textarea,select{width:100%;background:transparent;border:0;border-bottom:1px solid var(--gold-line);color:var(--ink);font:500 22px/1.3 var(--serif);padding:8px 2px;border-radius:0}
select{font-family:var(--sans);font-size:17px;appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--gold) 50%),linear-gradient(135deg,var(--gold) 50%,transparent 50%);background-position:calc(100% - 14px) 55%,calc(100% - 8px) 55%;background-size:6px 6px;background-repeat:no-repeat}
select option{background:var(--bg);color:var(--ink)}
textarea{min-height:72px;resize:vertical;font-size:20px}
input:focus,textarea:focus,select:focus{outline:none;border-bottom-color:var(--gold)}
.opciones{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.opciones label{display:flex;align-items:center;justify-content:center;min-height:52px;border:1px solid var(--gold-line);font-size:15px;cursor:pointer;text-align:center;padding:8px;transition:border-color .2s,background .2s}
.opciones input{position:absolute;opacity:0;pointer-events:none}
.opciones input:checked + span{color:var(--bg)}
.opciones label:has(input:checked){background:var(--gold);border-color:var(--gold)}
.opciones label:has(input:focus-visible){outline:2px solid var(--gold);outline-offset:2px}
.aviso{font-size:14px;color:var(--ink-soft);margin:0;text-align:center}
.error{color:#f0b8a0;font-size:14px;margin:0;text-align:center}
.listo{border:1px solid var(--gold-line);padding:20px;text-align:center;font-family:var(--serif);font-size:21px;line-height:1.4}
.numero{font-variant-numeric:tabular-nums;color:var(--ink);user-select:all}
.mensaje-listo{margin:12px 0 0;padding:12px 14px;border:1px dashed var(--gold-line);font-family:var(--sans);font-size:14px;line-height:1.5;text-align:left;white-space:pre-wrap;color:var(--ink-soft);user-select:all}

footer{padding-block:56px 64px;text-align:center;border-top:1px solid var(--gold-line)}
footer img{width:120px;height:auto;opacity:.9}
footer p{margin:14px 0 0;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--ink-soft)}

@keyframes subir{from{transform:translateY(14px)}to{transform:none}}
.tapa.abierta ~ main .portada > *{animation:subir .9s ease both}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}html{scroll-behavior:auto}}
</style>

<div class="tapa" id="tapa">
  <div class="tapa-foto" aria-hidden="true"></div>
  <div class="destello" aria-hidden="true"></div>
  <img src="/invitacion-privada/logo.png" alt="Aguas del Cerro">
  <div class="tapa-pie">
  <p class="label">Invitación privada</p>
  <div class="para" id="para" hidden>
    <span class="label" style="letter-spacing:.24em">Para</span>
    <strong id="para-nombre"></strong>
  </div>
  <button class="abrir" id="abrir" type="button">Abrir invitación</button>
  </div>
</div>

<main>
  <section class="portada">
    <div class="wrap">
      <img src="/invitacion-privada/logo.png" alt="Aguas del Cerro · Parque térmico y mirador gastronómico">
      <p class="label" style="margin-top:40px">Invitación privada</p>
      <p class="frase">Celebrar un año más es celebrar a quienes caminan a mi lado.</p>
      <p class="texto">Con motivo de mi cumpleaños, quiero que seas parte de una gran noche y de los primeros en vivir esta experiencia en Aguas del Cerro.</p>
      <p class="firma">Ivan Alvarez</p>
    </div>
  </section>

  <section class="alterno">
    <div class="wrap">
      <p class="label">Reservá la noche</p>
      <p class="fecha-dia">Sábado 14 de noviembre</p>
      <div class="fecha" aria-label="14 de noviembre de 2026">14<span>·</span>11<span>·</span>2026</div>
      <p class="hora">Desde las 22 hs</p>
      <div class="cuenta" id="cuenta" aria-live="off">
        <div><b id="d">00</b><small>Días</small></div>
        <div><b id="h">00</b><small>Horas</small></div>
        <div><b id="m">00</b><small>Min</small></div>
        <div><b id="s">00</b><small>Seg</small></div>
      </div>
      <p class="cuenta-fin" id="cuenta-fin" hidden>¡Hoy es la noche!</p>
    </div>
  </section>

  <section class="experiencia">
    <div class="wrap">
      <p class="label">Pre-inauguración privada</p>
      <h2>Antes que nadie</h2>
      <p class="texto">Una noche íntima para recorrer Aguas del Cerro antes de que abra sus puertas, rodeados de las personas que hacen especial este momento.</p>
    </div>
  </section>

  <section class="alterno">
    <div class="wrap">
      <p class="label">Para tener en cuenta</p>
      <h2>Detalles</h2>
      <div class="detalles">
        <div class="detalle">
          <p class="label">Dress code</p>
          <div class="circulos" aria-hidden="true"><i class="c1"></i><i class="c2"></i><i class="c3"></i></div>
          <p>Elegante sport<span>blanco, beige y marrón</span></p>
        </div>
        <div class="detalle">
          <p class="label">Traer</p>
          <svg class="icono" viewBox="0 0 58 42" aria-hidden="true"><path d="M2 14 C10 6 18 6 29 14 C40 22 48 22 56 14 M2 28 C10 20 18 20 29 28 C40 36 48 36 56 28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
          <p>Traje de baño</p>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <p class="label">Ubicación</p>
      <h2>Aguas del Cerro</h2>
      <p class="lugar">Al pie del cerro Velasco<em>La Rioja</em></p>
      <a class="boton" href="https://maps.app.goo.gl/aYV66QVLAFgYRHBB9?g_st=iw" target="_blank" rel="noopener">Cómo llegar</a>
    </div>
  </section>

  <section class="alterno" id="confirmar">
    <div class="wrap">
      <p class="label">Confirmá tu asistencia</p>
      <h2>¿Nos acompañás?</h2>
      <p class="texto" style="font-size:20px">Te pedimos que confirmes antes del sábado al mediodía.</p>
      <form id="form" novalidate>
        <div class="campo">
          <label for="nombre">Nombre y apellido</label>
          <input type="text" id="nombre" name="nombre" autocomplete="name" required>
        </div>
        <fieldset class="campo">
          <legend>¿Vas a asistir?</legend>
          <div class="opciones">
            <label><input type="radio" name="asiste" id="asiste-si" value="si"><span>Sí, voy a estar</span></label>
            <label><input type="radio" name="asiste" id="asiste-no" value="no"><span>No voy a poder</span></label>
          </div>
        </fieldset>
        <div class="campo">
          <label for="mensaje">Mensaje para Ivan (opcional)</label>
          <textarea id="mensaje" name="mensaje"></textarea>
        </div>
        <p class="error" id="error" hidden></p>
        <button class="boton lleno" type="submit" style="margin-top:0;width:100%">Preparar confirmación</button>
        <div class="listo" id="listo" hidden>
          <p style="margin:0">Tu respuesta está lista. Enviala por WhatsApp para confirmar.</p>
          <a class="boton lleno" id="wa" href="#" target="_blank" rel="noopener" style="width:100%">Enviar por WhatsApp</a>
          <a class="boton" id="waweb" href="#" target="_blank" rel="noopener" style="width:100%;margin-top:12px">Abrir en WhatsApp Web</a>
          <p class="aviso" style="margin-top:18px">¿No se abre? Copiá tu mensaje y envialo al <span class="numero">+54 9 380 491-0523</span></p>
          <p class="mensaje-listo" id="mensaje-listo"></p>
          <button class="boton" type="button" id="copiar" style="width:100%;margin-top:4px">Copiar mensaje</button>
        </div>
      </form>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <img src="/invitacion-privada/logo.png" alt="Aguas del Cerro">
    <p>Invitación personal e intransferible</p>
  </div>
</footer>

<script>
(function(){
  // Nombre del invitado: ?para=María González  (o #maria-gonzalez)
  var nombre = '';
  try { nombre = (new URLSearchParams(location.search).get('para') || '').trim().slice(0, 60); } catch (e) {}
  if (!nombre) {
    var h = decodeURIComponent((location.hash || '').slice(1));
    if (h && /^[a-z0-9-]+$/i.test(h)) {
      nombre = h.split('-').filter(Boolean).map(function(p){ return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); }).join(' ');
    }
  }
  if (nombre) {
    document.getElementById('para-nombre').textContent = nombre;
    document.getElementById('para').hidden = false;
    document.getElementById('nombre').value = nombre;
  }

  var tapa = document.getElementById('tapa');
  document.body.classList.add('cerrado');
  document.getElementById('abrir').addEventListener('click', function(){
    var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tapa.classList.add('amaneciendo');
    setTimeout(function(){
      tapa.classList.add('abierta');
      document.body.classList.remove('cerrado');
      window.scrollTo(0,0);
    }, reducir ? 0 : 1300);
  });

  // Cuenta regresiva al sábado 14/11/2026 22:00 (hora de Argentina)
  var objetivo = new Date('2026-11-14T22:00:00-03:00').getTime();
  function pad(n){ return String(n).padStart(2,'0'); }
  function tick(){
    var diff = objetivo - Date.now();
    if (diff <= 0) {
      document.getElementById('cuenta').hidden = true;
      document.getElementById('cuenta-fin').hidden = false;
      return;
    }
    var s = Math.floor(diff/1000);
    document.getElementById('d').textContent = pad(Math.floor(s/86400));
    document.getElementById('h').textContent = pad(Math.floor(s%86400/3600));
    document.getElementById('m').textContent = pad(Math.floor(s%3600/60));
    document.getElementById('s').textContent = pad(s%60);
  }
  tick(); setInterval(tick, 1000);

  // Confirmación por WhatsApp
  var form = document.getElementById('form');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var err = document.getElementById('error');
    var nombre = document.getElementById('nombre').value.trim();
    var asiste = form.querySelector('input[name=asiste]:checked');
    if (!nombre) { err.textContent = 'Escribí tu nombre y apellido.'; err.hidden = false; return; }
    if (!asiste) { err.textContent = 'Elegí si vas a asistir.'; err.hidden = false; return; }
    err.hidden = true;
    var msg = document.getElementById('mensaje').value.trim();
    var texto = 'Hola! Soy ' + nombre + '. ' +
      (asiste.value === 'si' ? 'Confirmo mi asistencia a la pre-inauguración privada de Aguas del Cerro el sábado 14/11.' : 'Lamentablemente no voy a poder asistir a la pre-inauguración del sábado 14/11.') +
      (msg ? '\n\n' + msg : '');
    var t = encodeURIComponent(texto);
    var movil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    document.getElementById('wa').href = 'https://api.whatsapp.com/send?phone=5493804910523&text=' + t;
    var web = document.getElementById('waweb');
    web.href = 'https://web.whatsapp.com/send?phone=5493804910523&text=' + t;
    web.hidden = movil;
    document.getElementById('mensaje-listo').textContent = texto;
    document.getElementById('listo').hidden = false;
  });

  document.getElementById('copiar').addEventListener('click', function(){
    var el = document.getElementById('mensaje-listo');
    var btn = this;
    function seleccionar(){ var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Mensaje seleccionado: copialo'; }
    try {
      navigator.clipboard.writeText(el.textContent).then(function(){ btn.textContent = 'Mensaje copiado'; }, seleccionar);
    } catch(e) { seleccionar(); }
  });
})();
</script>
`;

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const para = (url.searchParams.get('para') ?? '').trim().slice(0, 60);
  const base = `https://${SITE.publicHost}`;
  const title = 'Ivan Alvarez · Invitación privada';
  const description = para
    ? `Para ${para}. Sábado 14 de noviembre, 22 hs · Pre-inauguración privada de Aguas del Cerro.`
    : 'Sábado 14 de noviembre, 22 hs · Pre-inauguración privada de Aguas del Cerro.';
  const shareUrl = para ? `${base}${PATH}?para=${encodeURIComponent(para)}` : `${base}${PATH}`;

  const head = [
    '<!doctype html><html lang="es"><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    '<meta name="robots" content="noindex, nofollow">',
    '<meta name="theme-color" content="#24130a">',
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(shareUrl)}">`,
    `<meta property="og:image" content="${base}/invitacion-privada/og.jpg">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:locale" content="es_AR">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="/icon.png">',
    '</head><body>',
  ].join('');

  return new Response(`${head}${BODY}</body></html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
