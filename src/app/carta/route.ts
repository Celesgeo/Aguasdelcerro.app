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
header h1{margin:22px 0 0;font-family:var(--display);font-weight:600;font-size:34px;letter-spacing:.2em}
header .sub{margin:6px 0 0;font-family:var(--serif);font-style:italic;font-size:20px;color:var(--ink-soft)}
nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:rgba(36,19,10,.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid var(--gold-line);border-bottom:1px solid var(--gold-line)}
nav .wrap{display:flex;justify-content:center;gap:6px;padding-block:10px}
nav a{color:var(--ink);text-decoration:none;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:10px 12px;border-radius:999px}
nav a:hover,nav a:focus-visible{background:rgba(207,174,114,.16);color:var(--gold);outline:none}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}

.firma{padding-block:34px 10px}
.destacada{position:relative;border:1px solid var(--gold);padding:30px 24px 26px;text-align:center;background:radial-gradient(120% 90% at 50% 0%,rgba(207,174,114,.14),transparent 60%),var(--bg-2)}
.destacada::after{content:"";position:absolute;inset:7px;border:1px solid var(--gold-line);pointer-events:none}
.destacada svg{display:block;margin:10px auto 0;width:150px;height:auto}
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
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
</style>

<header>
  <div class="wrap">
    <img src="/invitacion-privada/logo.png" alt="Aguas del Cerro · Parque térmico y mirador gastronómico">
    <h1>Carta</h1>
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
        <svg viewBox="0 0 160 110" aria-hidden="true">
          <g fill="none" stroke="#cfae72" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 46c0-22 28-34 62-34s62 12 62 34z"/>
            <path d="M58 26l2 1M80 21l2 1M101 26l2 1M70 34l2 1M92 33l2 1"/>
            <path d="M14 56c10 6 20-4 30 2s20-4 30 2 20-4 30 2 20-4 34 0"/>
            <path d="M16 66h128"/>
            <path d="M22 66l10 9 10-9 10 9 10-9 10 9 10-9 10 9 10-9 10 9 10-9 10 9"/>
            <path d="M18 82h124c0 9-6 16-16 16H34c-10 0-16-7-16-16z"/>
          </g>
          <circle cx="80" cy="6" r="2.4" fill="#cfae72"/>
        </svg>
        <h2>Hamburguesa Amanecer</h2>
        <p class="tag">Para empezar el día como se debe.</p>
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
        <li class="item"><div class="linea"><h3>Línea Coca-Cola</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$5.000</span></div><p class="desc">Botella de 1,5 L.</p></li>
        <li class="item"><div class="linea"><h3>Limonada</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$6.000</span></div><p class="desc">Jarra.</p></li>
        <li class="item"><div class="linea"><h3>Licuados</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$6.000</span></div></li>
        <li class="item"><div class="linea"><h3>Exprimidos</h3><span class="puntos" aria-hidden="true"></span><span class="precio">$4.500</span></div></li>
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
