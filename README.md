# Aguas del Cerro

Sitio web oficial de **Aguas del Cerro** — Parque Térmico & Mirador Gastronómico, La Rioja, Argentina.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Framer Motion
- React Hook Form

## Desarrollo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Media

Colocá fotos en `public/images/` y videos en `public/videos/`.  
La galería las detecta automáticamente según el nombre del archivo.

## Deploy en Railway

El proyecto está configurado con `output: "standalone"` y un `Dockerfile` listo para Railway.

### 1. Subir el código a GitHub

```bash
git init
git add .
git commit -m "Listo para deploy en Railway"
# Creá el repo en GitHub y después:
git remote add origin https://github.com/TU_USUARIO/aguasdelcerro.git
git push -u origin main
```

### 2. Crear el proyecto en Railway

1. Entrá a [railway.app](https://railway.app) e iniciá sesión.
2. **New Project** → **Deploy from GitHub repo** → elegí este repositorio.
3. Railway detecta el `Dockerfile` y hace el build solo.
4. En el servicio → **Settings** → **Networking** → **Generate Domain**.

### Alternativa: CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway up
railway domain
```

### Variables de entorno (Railway)

Configurá en Railway → Variables (nunca las subas al repo):

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` (mín. 10 caracteres, fuerte)
- `ADMIN_SESSION_SECRET` (mín. 32 caracteres aleatorios)
- `NODE_ENV=production`
- `NEXT_PUBLIC_SITE_URL=https://tu-dominio.com.ar`

Localmente: copiá `.env.example` → `.env.local` y completá los valores.

## Dominio de DonWeb apuntando a Railway

La app corre en Railway. En DonWeb solo configurás el DNS del dominio:

1. En Railway → **Settings** → **Networking** → **Custom Domain** → agregá tu dominio (ej. `aguasdelcerro.com` o `www.aguasdelcerro.com`).
2. Railway te muestra un registro **CNAME** (o A).
3. En el panel DNS de DonWeb:
   - Para `www`: tipo **CNAME** → valor que te da Railway (ej. `xxx.up.railway.app`).
   - Para dominio raíz (`@`): según DonWeb, usá CNAME flattening / ALIAS si lo ofrece, o el registro A que indique Railway.
4. Esperá la propagación DNS (puede tardar minutos u horas). Railway emite el certificado SSL solo.

> **Nota:** DonWeb hosting compartido (cPanel/PHP) no sirve para correr Next.js. Lo correcto es hostear la app en Railway (o un VPS con Node) y usar DonWeb solo para el **dominio + DNS**.

## Panel de administración

URL: `/admin/login`  
Las credenciales viven solo en variables de entorno (`.env.local` / Railway). **No se versionan en GitHub.**

Desde el panel podés:

- Alta / edición / baja de socios
- Asignar y modificar el **número único de acceso**
- Código de 5 dígitos para descarga del carnet en `/membresias`
- Cargar usos de experiencias con **fecha y hora**
- Ver experiencias disponibles restantes

Los socios se guardan en `data/members-store.json` (en Railway conviene montar un volumen en `/app/data`).

## Páginas

- `/` — Inicio
- `/experiencias`
- `/galeria`
- `/gastronomia`
- `/termas` (Parque Térmico)
- `/membresias`
- `/admin/login` — panel de socios
- `/contacto`
- `/reservas`
