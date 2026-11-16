export const dynamic = 'force-dynamic';

const BODY = `<style>
@font-face{font-family:'Cinzel';src:url(/invitacion-privada/fonts/cinzel.woff) format('woff');font-weight:400 900;font-display:swap}
@font-face{font-family:'Cormorant Garamond';src:url(/invitacion-privada/fonts/cormorant.woff) format('woff');font-weight:300 700;font-display:swap}
@font-face{font-family:'Cormorant Garamond';src:url(/invitacion-privada/fonts/cormorant-italic.woff) format('woff');font-weight:300 700;font-style:italic;font-display:swap}
@font-face{font-family:'Inter';src:url(/invitacion-privada/fonts/inter.woff) format('woff');font-weight:100 900;font-display:swap}
/* Carta de mesa: una columna estilo menú impreso, la hamburguesa de la casa como pieza central. */
:root{
  --bg:#24130a; --bg-2:#2e190d; --ink:#f3ebdc; --ink-soft:rgba(243,235,220,.72);
  --gold:#cfae72; --gold-line:rgba(207,174,114,.4);
  --display:'Cinzel',Georgia,serif; --serif:'Cormorant Garamond',Garamond,Georgia,serif; --sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  color-scheme:dark; padding-top:env(safe-area-inset-top,0px); padding-bottom:env(safe-area-inset-bottom,0px);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}
img{max-width:100%}
.wrap{max-width:560px;margin:0 auto;padding-left:max(20px,env(safe-area-inset-left,0px));padding-right:max(20px,env(safe-area-inset-right,0px))}
.label{margin:0;font-size:11.5px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--gold)}
header{padding-block:44px 30px;text-align:center;background:linear-gradient(180deg,rgba(0,0,0,.25),transparent),var(--bg)}
header img{width:min(210px,56vw);height:auto;display:block;margin:0 auto}

header .sub{margin:6px 0 0;font-family:var(--serif);font-style:italic;font-size:20px;color:var(--ink-soft)}
nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:rgba(36,19,10,.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid var(--gold-line);border-bottom:1px solid var(--gold-line)}
nav .wrap{display:flex;justify-content:center;gap:6px;padding-block:10px}
nav a{color:var(--ink);text-decoration:none;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:10px 12px;border-radius:999px}
nav a:hover,nav a:focus-visible{background:rgba(207,174,114,.16);color:var(--gold);outline:none}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}

.firma{padding-block:34px 10px}
.destacada{position:relative;border:1px solid var(--gold);padding:30px 24px 26px;text-align:center;background:radial-gradient(120% 90% at 50% 0%,rgba(207,174,114,.14),transparent 60%),var(--bg-2)}
.destacada::after{content:"";position:absolute;inset:7px;border:1px solid var(--gold-line);pointer-events:none}
.destacada h2{margin:16px 0 0;font-family:var(--display);font-weight:600;font-size:clamp(28px,8.4vw,38px);letter-spacing:.06em;line-height:1.05}
.destacada .tag{margin:8px 0 0;font-family:var(--serif);font-style:italic;font-size:21px;color:var(--gold)}
.destacada .ing{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:18px 0 0;padding:0;list-style:none}
.destacada .ing li{font-size:13px;letter-spacing:.06em;padding:6px 12px;border:1px solid var(--gold-line);border-radius:999px;color:var(--ink)}
.destacada .precio-grande{margin:20px 0 0;font-family:var(--display);font-weight:600;font-size:34px;color:var(--gold);font-variant-numeric:tabular-nums}

section.grupo{padding-block:38px 6px}
section.grupo > .wrap > h2{display:flex;align-items:center;gap:14px;margin:0;font-family:var(--display);font-weight:600;font-size:21px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
section.grupo > .wrap > h2::after{content:"";flex:1;height:1px;background:var(--gold-line)}
ul.lista{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column}
.item{padding:14px 0;border-bottom:1px solid rgba(207,174,114,.14)}
.item:last-child{border-bottom:0}
.linea{display:flex;align-items:baseline;gap:10px}
.item h3{margin:0;font-family:var(--serif);font-weight:600;font-size:23px;line-height:1.2;min-width:0}
.puntos{flex:1;border-bottom:1px dotted rgba(207,174,114,.5);transform:translateY(-5px);min-width:16px}
.precio{font-family:var(--sans);font-weight:600;font-size:17px;color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap}
.desc{margin:4px 0 0;font-size:14.5px;color:var(--ink-soft)}
footer{padding-block:40px 48px;text-align:center}
footer p{margin:0;font-size:12.5px;color:var(--ink-soft);line-height:1.7}
footer .label{margin-bottom:8px}

/* Escena: la Coca se sirve entre las letras */
.escena-titulo{position:relative;width:min(340px,100%);margin:8px auto 0;padding-top:118px;padding-bottom:96px}
.titulo{margin:0;display:flex;justify-content:center;font-family:var(--display);font-weight:600;font-size:46px;letter-spacing:.06em;line-height:1}
.titulo span{display:inline-block}
.titulo .hueco{width:30px}
.botella{position:absolute;left:calc(50% - 97px);top:-14px;width:40px;transform-origin:50% 85%;transform:rotate(112deg)}
.chorro{position:absolute;left:calc(50% - 2px);top:100px;width:5px;height:126px;border-radius:3px;background:linear-gradient(90deg,#2a0c04,#7a2e12 50%,#2a0c04);transform-origin:top;transform:scaleY(1)}
.vaso{position:absolute;left:calc(50% - 30px);bottom:0;width:60px}
.liquido{transform-box:fill-box;transform-origin:bottom;transform:scaleY(.82)}
.espuma{transform:translateY(0)}
.burbuja{opacity:0}
@media (prefers-reduced-motion:no-preference){
  .escena-titulo.anim .botella{animation:inclinar 4.6s ease-in-out both}
  .escena-titulo.anim .chorro{animation:chorro 4.6s ease-in-out both}
  .escena-titulo.anim .liquido{animation:llenar 4.6s ease-in-out both}
  .escena-titulo.anim .espuma{animation:espuma 4.6s ease-in-out both}
  .escena-titulo.anim .burbuja{animation:burbuja 1.6s ease-in infinite 1.6s}
  .escena-titulo.anim .b2{animation-delay:2s}.escena-titulo.anim .b3{animation-delay:2.4s}
  .escena-titulo.anim .titulo span{animation:letra .7s cubic-bezier(.2,.8,.3,1.2) both}
  .escena-titulo.anim .titulo span:nth-child(2){animation-delay:.08s}.escena-titulo.anim .titulo span:nth-child(3){animation-delay:.16s}.escena-titulo.anim .titulo span:nth-child(5){animation-delay:.24s}.escena-titulo.anim .titulo span:nth-child(6){animation-delay:.32s}
}
@keyframes inclinar{0%{transform:translate(40px,-40px) rotate(20deg);opacity:0}15%{transform:translate(0,0) rotate(60deg);opacity:1}30%,80%{transform:rotate(112deg)}100%{transform:rotate(112deg)}}
@keyframes chorro{0%,28%{transform:scaleY(0);opacity:1}40%{transform:scaleY(1)}82%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:1}}
@keyframes llenar{0%,36%{transform:scaleY(0)}90%,100%{transform:scaleY(.82)}}
@keyframes espuma{0%,36%{transform:translateY(64px)}90%,100%{transform:translateY(0)}}
@keyframes burbuja{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-52px)}}
@keyframes letra{from{transform:translateY(-18px);opacity:0}to{transform:none;opacity:1}}

/* La hamburguesa se arma capa por capa */
.armado{width:min(240px,74%);margin:8px auto 0;perspective:600px}
.armado svg{display:block;width:100%;height:auto;overflow:visible;transform:rotateX(10deg)}
.capa{transform-box:view-box}
@media (prefers-reduced-motion:no-preference){
  .destacada.anim .capa{animation:caer .62s cubic-bezier(.3,.6,.35,1.25) both}
  .destacada.anim .c2{animation-delay:.32s}.destacada.anim .c3{animation-delay:.64s}.destacada.anim .c4{animation-delay:.96s}
  .destacada.anim .c5{animation-delay:1.28s}.destacada.anim .c6{animation-delay:1.6s}.destacada.anim .c7{animation-delay:1.92s}
  .destacada.anim .sombra{animation:sombra 2.6s ease-out both}
}
@keyframes caer{0%{transform:translateY(-230px);opacity:0}55%{opacity:1}100%{transform:none;opacity:1}}
@keyframes sombra{from{opacity:.2}to{opacity:1}}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
</style>

<header>
  <div class="wrap">
    <img src="/invitacion-privada/logo.png" alt="Aguas del Cerro · Parque térmico y mirador gastronómico">
    <div class="escena-titulo">
      <svg class="botella" viewBox="0 0 60 150" aria-hidden="true">
        <defs>
          <linearGradient id="vidrio" x1="0" x2="1"><stop offset="0" stop-color="#2a0f06"/><stop offset=".35" stop-color="#5a2412"/><stop offset=".55" stop-color="#7a3a1e"/><stop offset="1" stop-color="#220c05"/></linearGradient>
        </defs>
        <path d="M24 2h12v26c0 8 14 14 14 34v78c0 5-4 8-8 8H18c-4 0-8-3-8-8V62c0-20 14-26 14-34z" fill="url(#vidrio)" stroke="rgba(243,235,220,.35)" stroke-width="1.2"/>
        <rect x="22" y="0" width="16" height="7" rx="2" fill="#c8102e"/>
        <rect x="10" y="78" width="40" height="30" fill="#c8102e"/>
        <path d="M16 70v66" stroke="rgba(255,255,255,.28)" stroke-width="3" stroke-linecap="round"/>
      </svg>
      <span class="chorro" aria-hidden="true"></span>
      <h1 class="titulo"><span>C</span><span>A</span><span>R</span><span class="hueco" aria-hidden="true"></span><span>T</span><span>A</span></h1>
      <svg class="vaso" viewBox="0 0 70 90" aria-hidden="true">
        <defs>
          <clipPath id="vaso-clip"><path d="M8 6h54l-6 78H14z"/></clipPath>
          <linearGradient id="gaseosa" x1="0" x2="1"><stop offset="0" stop-color="#3a1206"/><stop offset=".5" stop-color="#6b250c"/><stop offset="1" stop-color="#2a0c04"/></linearGradient>
        </defs>
        <g clip-path="url(#vaso-clip)">
          <rect class="liquido" x="0" y="6" width="70" height="80" fill="url(#gaseosa)"/>
          <rect class="espuma" x="0" y="20" width="70" height="5" fill="#d9b48a"/>
          <circle class="burbuja b1" cx="24" cy="80" r="1.6" fill="rgba(255,240,220,.7)"/>
          <circle class="burbuja b2" cx="40" cy="80" r="1.2" fill="rgba(255,240,220,.7)"/>
          <circle class="burbuja b3" cx="50" cy="80" r="1.4" fill="rgba(255,240,220,.7)"/>
        </g>
        <path d="M8 6h54l-6 78H14z" fill="rgba(255,255,255,.06)" stroke="rgba(243,235,220,.6)" stroke-width="1.6"/>
        <path d="M15 12l4 66" stroke="rgba(255,255,255,.3)" stroke-width="2.4" stroke-linecap="round"/>
      </svg>
    </div>
    <p class="sub">Mirador gastronómico</p>
  </div>
</header>

<nav aria-label="Secciones de la carta">
  <div class="wrap">
    <a href="#hamburguesas">Hamburguesas</a>
    <a href="#comidas">Comidas</a>
    <a href="#bebidas">Bebidas</a>
  </div>
</nav>

<main>
  <section class="firma" id="hamburguesas">
    <div class="wrap">
      <article class="destacada">
        <p class="label">La de la casa</p>
        <div class="armado" aria-hidden="true">
          <svg viewBox="0 0 220 200">
            <defs>
              <linearGradient id="pan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9a95a"/><stop offset=".6" stop-color="#c47a32"/><stop offset="1" stop-color="#8a4f1c"/></linearGradient>
              <linearGradient id="carne" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3a1f"/><stop offset="1" stop-color="#3a1b0b"/></linearGradient>
              <radialGradient id="yema" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe08a"/><stop offset=".6" stop-color="#f6b822"/><stop offset="1" stop-color="#d98b0b"/></radialGradient>
            </defs>
            <ellipse class="sombra" cx="110" cy="188" rx="86" ry="8" fill="rgba(0,0,0,.45)"/>
            <g class="capa c1"><path d="M28 156h164c0 14-10 26-26 26H54c-16 0-26-12-26-26z" fill="url(#pan)"/><path d="M28 156h164" stroke="#f3c88a" stroke-width="2" opacity=".5"/></g>
            <g class="capa c2"><path d="M22 148c10-8 18 6 28-2s18 6 28-2 18 6 28-2 18 6 28-2 18 6 28-2 16 6 26 0l2 12H20z" fill="#7cb342"/><path d="M22 148c10-8 18 6 28-2s18 6 28-2 18 6 28-2 18 6 28-2 18 6 28-2 16 6 26 0" fill="none" stroke="#a5d16a" stroke-width="2"/></g>
            <g class="capa c3"><rect x="30" y="126" width="160" height="24" rx="12" fill="url(#carne)"/><path d="M48 134l6 2M80 140l7-2M112 133l6 3M146 139l6-2M168 133l5 2" stroke="#2a1206" stroke-width="2.4" stroke-linecap="round"/></g>
            <g class="capa c4"><path d="M24 118h172l-8 10-10 12-8-12H140l-10 16-9-16H80l-8 12-8-12H38z" fill="#f2a516"/><path d="M24 118h172" stroke="#ffd36b" stroke-width="2"/></g>
            <g class="capa c5"><path d="M70 104c-16 0-28 8-22 14s32 6 50 4 52 2 54-6-14-12-30-12-34-2-52 0z" fill="#fbf6ea"/><ellipse cx="108" cy="108" rx="16" ry="10" fill="url(#yema)"/><ellipse cx="103" cy="105" rx="5" ry="3" fill="rgba(255,255,255,.55)"/></g>
            <g class="capa c6"><ellipse cx="78" cy="96" rx="34" ry="8" fill="#d84a3a"/><ellipse cx="142" cy="96" rx="34" ry="8" fill="#c63a2c"/><ellipse cx="78" cy="94" rx="24" ry="4" fill="#ef7a62" opacity=".7"/><ellipse cx="142" cy="94" rx="24" ry="4" fill="#ef7a62" opacity=".6"/></g>
            <g class="capa c7"><path d="M26 90c0-40 38-62 84-62s84 22 84 62z" fill="url(#pan)"/><path d="M50 62c18-20 48-26 76-22" stroke="#ffd9a0" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/>
              <g fill="#fbefd6"><ellipse cx="80" cy="50" rx="4" ry="2.2" transform="rotate(-20 80 50)"/><ellipse cx="108" cy="42" rx="4" ry="2.2"/><ellipse cx="136" cy="50" rx="4" ry="2.2" transform="rotate(20 136 50)"/><ellipse cx="94" cy="64" rx="4" ry="2.2" transform="rotate(10 94 64)"/><ellipse cx="124" cy="66" rx="4" ry="2.2" transform="rotate(-12 124 66)"/><ellipse cx="66" cy="70" rx="4" ry="2.2" transform="rotate(-30 66 70)"/><ellipse cx="152" cy="70" rx="4" ry="2.2" transform="rotate(30 152 70)"/></g></g>
          </svg>
        </div>
        <h2>Hamburguesa Amanecer</h2>
        <ul class="ing" aria-label="Ingredientes">
          <li>Tomate</li><li>Lechuga</li><li>Huevo</li><li>Cheddar</li>
        </ul>
        <p class="precio-grande">$12.000</p>
      </article>
      <ul class="lista">
        <li class="item"><div class="linea"><h3>Hamburguesa clásica</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$8.000</span></div><p class="desc">Tomate, lechuga y queso.</p></li>
      </ul>
    </div>
  </section>

  <section class="grupo" id="comidas">
    <div class="wrap">
      <h2>Comidas</h2>
      <ul class="lista">
        <li class="item"><div class="linea"><h3>Pizza</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$13.000</span></div></li>
        <li class="item"><div class="linea"><h3>Tostado</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$8.000</span></div></li>
      </ul>
    </div>
  </section>

  <section class="grupo" id="bebidas">
    <div class="wrap">
      <h2>Bebidas frías</h2>
      <ul class="lista">
        <li class="item"><div class="linea"><h3>Coca-Cola</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$5.000</span></div><p class="desc">Línea Coca-Cola · Botella de 1,5 L.</p></li>
        <li class="item"><div class="linea"><h3>Agua mineral</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$3.000</span></div><p class="desc">Botella de 1,5 L.</p></li>
        <li class="item"><div class="linea"><h3>Limonada</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$6.000</span></div><p class="desc">Jarra.</p></li>
        <li class="item"><div class="linea"><h3>Licuados</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$6.000</span></div></li>
        <li class="item"><div class="linea"><h3>Exprimidos</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$5.000</span></div></li>
      </ul>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <p class="label">Aguas del Cerro</p>
    <p>Precios finales en pesos argentinos.</p>
  </div>
</footer>

<script>
(function(){
  var objetivos = document.querySelectorAll('.escena-titulo, .destacada');
  function activar(el){ el.classList.remove('anim'); void el.offsetWidth; el.classList.add('anim'); }
  if (!('IntersectionObserver' in window)) { objetivos.forEach(activar); return; }
  var io = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){ if (e.isIntersecting) { activar(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.35 });
  objetivos.forEach(function(el){ io.observe(el); });
})();
</script>
`;

export function GET(): Response {
  const head = [
    '<!doctype html><html lang="es"><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<title>Carta · Aguas del Cerro</title>',
    '<meta name="robots" content="noindex, nofollow">',
    '<meta name="theme-color" content="#24130a">',
    '<link rel="icon" href="/icon.png">',
    '</head><body>',
  ].join('');

  return new Response(`${head}${BODY}</body></html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
