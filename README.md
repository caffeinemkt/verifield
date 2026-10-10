# Verifield 🇲🇽
### Plataforma de Control de Asistencia Offline-First, Geocercas Interactivas, Regulación de 40 Horas, NOM-151 y Pre-Nómina LFT
**Cliente:** Green Seven México

**Verifield** es una plataforma web responsiva y PWA (mobile-first para colaboradores en ruta y campo, y desktop-optimized para supervisores y recursos humanos) diseñada para compliance laboral en México conforme a la Ley Federal del Trabajo (LFT) y la NOM-151-SCFI-2016.

---

## 🏛️ 1. Arquitectura y Stack Tecnológico
- **Frontend:** Next.js 16 (App Router con Turbopack), React 19, TypeScript 5.
- **Estilos & UI:** Tailwind CSS v4, Lucide Icons, diseño minimalista inspirado en SaaS modernos.
- **Base de Datos & Storage:** Supabase (PostgreSQL, Row Level Security, Storage Buckets).
- **Offline-First:** IndexedDB (`idb`) y Service Worker PWA (`public/sw.js`).
- **Geocercas & Mapas:** Leaflet con OpenStreetMap, geocodificación por dirección y pin interactivo con radio configurable.
- **Compliance Criptográfico:** Hash canónico SHA-256 conforme a la NOM-151-SCFI-2016 y recibos TSA simulados ante la Secretaría de Economía.
- **Pre-Nómina:** Exportación a **Excel (.xlsx)** estructurado para **CONTPAQi Nóminas** y **Aspel NOI**, y **PDF formal** con firmas.

---

## 👥 2. Modalidades de Colaboradores Soportadas
- 🏢 **Oficina:** Validación estricta contra geocerca corporativa (150m).
- 🏠 **Home Office:** Geocerca domiciliaria residencial configurable (50m - 100m).
- 🚛 **Chofer / Ruta:** Registro de ubicación libre con GPS satelital.
- 💼 **Vendedor de Campo:** Marcaje libre en visitas a clientes.
- 🏗️ **Constructor / Obra:** Geocerca sobre el predio de construcción (150m - 500m).
- 🛡️ **Empleado de Seguridad:** Geocerca perimetral en caseta de vigilancia (50m - 80m).
- 📦 **Operativo / CEDIS:** Geocerca en almacén o centro de distribución (200m - 300m).

---

## 🚨 3. Alertas de Asistencia y Puntualidad
- Centro de notificaciones en tiempo real para administradores y supervisores.
- Contadores dinámicos de **Retrasos** (Leves y Graves) y **Faltas** (Inasistencias y regla LFT: *3 retardos acumulados = 1 falta*).
- Panel de gestión para auditar y justificar incidencias al instante.

---

## 🚀 4. Despliegue en Vercel

### Opción A: Despliegue con 1 Clic desde el Dashboard de Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub (`caffeinemkt`).
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona el repositorio **`verifield`**.
4. Deja la configuración predeterminada de Next.js (`Build Command: next build`, `Output Directory: .next`).
5. (Opcional) Si vas a conectar Supabase en producción, agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Haz clic en **"Deploy"**. En menos de 2 minutos tu plataforma estará en línea con HTTPS y CDN global.

---

## 💻 5. Puesta en Marcha Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
