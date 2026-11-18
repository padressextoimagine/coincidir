# 📅 Coincidir

Herramienta simple para encontrar el mejor horario de reunión para un grupo (al estilo When2meet), en **español e inglés**.

1. Alguien crea la reunión: elige fechas posibles y rango horario.
2. Comparte el link (botón de copiar o WhatsApp).
3. Cada persona escribe su nombre y **pinta** los horarios en que puede.
4. La app muestra un mapa de calor del grupo, quién puede y quién no en cada horario, y un ranking de **mejores horarios** según la duración de la reunión.

Detalles:
- Sin cuentas ni contraseñas: alcanza con el nombre. Para editar, se vuelve a escribir el mismo nombre.
- Zonas horarias: cada persona ve los horarios en su zona (se puede cambiar).
- Funciona en celular (se marca deslizando el dedo).
- Se actualiza sola cada 15 segundos.

---

## Publicarla (unos 10 minutos, gratis)

### 1. Base de datos en Supabase

1. Crear una cuenta en <https://supabase.com> y un **New project** (plan Free).
2. Ir a **SQL Editor → New query**, pegar todo el contenido de `supabase.sql` y presionar **Run**.
3. Ir a **Project Settings → API** (o **API Keys**) y copiar:
   - **Project URL** (ej.: `https://abcdefgh.supabase.co`)
   - La clave pública: **Publishable key** (`sb_publishable_...`) o, en proyectos más viejos, **anon public**.
4. Pegar ambos valores en `config.js`.

> Esas dos claves son públicas por diseño. **Nunca** pongas la `service_role` / `secret key` en este archivo.

### 2. Publicar en GitHub Pages

1. Crear un repositorio nuevo en GitHub (ej.: `coincidir`) y subir todos los archivos (**Add file → Upload files**).
2. Ir a **Settings → Pages**, en **Source** elegir **Deploy from a branch**, rama `main`, carpeta `/ (root)`, y **Save**.
3. En 1 o 2 minutos la app queda en `https://TU-USUARIO.github.io/coincidir/`.

### Probar sin configurar nada

Si `config.js` queda vacío, la app funciona en **modo demo**: los datos quedan solo en tu navegador. Sirve para probarla, pero no para compartirla.
Para probarla en tu computadora: `python3 -m http.server` dentro de la carpeta y abrir <http://localhost:8000>.

---

## Para tener en cuenta

- Como en When2meet, cualquiera que tenga el link puede ver y responder. Usa la herramienta para coordinar horarios, no para datos sensibles.
- En el plan gratuito de Supabase, los proyectos sin actividad durante un tiempo pueden pausarse. Si pasa, se reactivan desde el panel de Supabase.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura de la página |
| `app.js` | Toda la lógica (sin dependencias) |
| `styles.css` | Estilos |
| `config.js` | URL y clave de Supabase |
| `supabase.sql` | Tablas y permisos de la base de datos |
