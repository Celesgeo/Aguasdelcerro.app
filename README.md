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
- `NEXT_PUBLIC_SITE_URL=https://aguasdelcerroapp-production.up.railway.app`  
  (cuando el `.com.ar` esté activo, cambialo a `https://aguasdelcerro.com.ar`)

Localmente: copiá `.env.example` → `.env.local` y completá los valores.

## Conectar dominio `.com.ar` de DonWeb a Railway

La app **sigue en Railway**. DonWeb solo administra el dominio y el DNS.

### Paso 1 — Railway (Custom Domain)

1. Entrá a tu servicio en Railway.
2. **Settings → Networking → Custom Domain**.
3. Agregá:
   - `aguasdelcerro.com.ar`
   - `www.aguasdelcerro.com.ar`
4. Railway te va a mostrar los registros DNS a crear (normalmente **CNAME** hacia algo como `xxxxx.up.railway.app`, o un registro **A** / instrucciones para el apex).

### Paso 2 — DonWeb (DNS del dominio)

En el panel DNS de DonWeb para `aguasdelcerro.com.ar`:

| Tipo | Nombre / Host | Valor / Destino | TTL |
|------|----------------|-----------------|-----|
| CNAME | `www` | el target que te da Railway (ej. `aguasdelcerroapp-production.up.railway.app` o el CNAME específico) | 3600 |
| CNAME o ALIAS/A | `@` (raíz) | según indique Railway para el dominio raíz | 3600 |

Notas:
- Si DonWeb no permite CNAME en `@`, usá el registro **A** / **ALIAS** que Railway muestre al agregar el custom domain.
- **No** apuntes el dominio al hosting PHP de DonWeb.
- Sacá o evitá registros viejos de `www` / `@` que apunten a otro hosting.

### Paso 3 — SSL y variable final

1. Esperá la propagación DNS (minutos a unas horas).
2. Railway emite el certificado SSL solo cuando el DNS ya apunta bien.
3. En Railway → Variables, actualizá:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://aguasdelcerro.com.ar
   ```
4. Hacé **Redeploy**.

### Verificación rápida

- https://aguasdelcerro.com.ar  
- https://www.aguasdelcerro.com.ar  
- https://aguasdelcerro.com.ar/admin/login  

> **Importante:** DonWeb hosting compartido (cPanel/PHP) no sirve para Next.js. Usá DonWeb solo para **dominio + DNS**.

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
