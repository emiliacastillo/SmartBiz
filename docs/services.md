# Servicios con imágenes, contactos y estadísticas

Todos los negocios comparten las mismas funciones. No es necesario asignar una
categoría de negocio para crear servicios, galerías o enlaces.

## Uso

1. En el dashboard del negocio, abre **Add service or link** o edita un servicio.
2. Escribe el nombre, la descripción y, opcionalmente, un destino principal.
3. Añade hasta 12 imágenes, mediante archivos JPEG/PNG/WebP de hasta 2 MB cada uno
   desde el dispositivo. Añade una descripción a cada imagen y usa las flechas para ordenarlas.
4. Añade hasta 20 acciones: enlace, teléfono (`tel:+...`), correo (`mailto:...`),
   WhatsApp (`https://wa.me/...`), red social o tienda (URL HTTP/HTTPS).
   Cada imagen también tiene su propio editor de enlaces y contactos (hasta 20).
   Esos botones aparecen bajo la imagen seleccionada y en su vista ampliada.
5. Guarda el servicio. En la administración del negocio, asigna los servicios que
   debe mostrar cada tag. Los tags creados después reciben los servicios activos.
6. En la página pública, navega por el carrusel y pulsa una imagen para ampliarla.
   El diálogo admite Escape, cierre con botón y navegación por las demás imágenes.

La descripción del servicio se abre con **Ver descripción**. No hace falta añadir
un destino principal: un servicio puede consistir en imágenes, texto y contactos.

## Estadísticas

El dashboard muestra **Contenido consultado por servicio** para el período elegido.
Se registran eventos, no personas únicas ni la identidad del visitante:

| Evento | Significado |
| --- | --- |
| SERVICE_VIEW | Apertura de la descripción |
| IMAGE_VIEW | Cambio de imagen mediante los controles del carrusel |
| IMAGE_EXPAND | Apertura de una imagen ampliada |
| LINK_CLICK | Clic en el destino principal o en un contacto/enlace adicional |

El servidor deriva el tipo de información de los datos guardados (imagen, correo,
teléfono, red social, tienda, etc.). Valida que el servicio y el negocio estén
activos y, cuando hay un tag, que esté activo, pertenezca al negocio y tenga asignado
el servicio. Un clic mide intención de abrir un destino, no confirma una llamada,
compra ni visita completada en otro sitio. Los eventos antiguos conservan sus
estadísticas previas; no se les inventa un tipo de información retroactivamente.

Los clics en botones de imágenes se distinguen como `IMAGE_PHONE`, `IMAGE_EMAIL`,
`IMAGE_WHATSAPP`, `IMAGE_SOCIAL`, `IMAGE_STORE` o `IMAGE_LINK`. El evento conserva
los IDs de imagen y acción en `targetId` como un array JSON, y el dashboard muestra
etiquetas como «Imagen: Tienda». El endpoint acepta `imageId` solo para estos clics
y valida que la acción pertenezca a esa imagen. Las imágenes antiguas sin acciones
siguen funcionando; esta ampliación utiliza el JSON existente y no añade migraciones.

## Datos y despliegue

La migración `20261012000000_service_content` añade campos a `BusinessLink` e
`Interaction`, tipos de eventos y la tabla `UploadedImage`. No borra ni renombra
los negocios o servicios existentes. Los campos nuevos tienen valores vacíos por
defecto para los servicios existentes.

Antes de poner en ejecución esta versión, aplica la migración a la base de datos
correcta del entorno de destino:

```sh
npx prisma migrate deploy
npm run build
```

La migración se probó primero en PostgreSQL temporal y después se aplicó a la base
Neon configurada en este workspace para corregir el error de estadísticas. En otros
entornos, comprueba las migraciones pendientes antes de desplegar. No ejecutes el
seed para activar esta función. El código todavía requiere despliegue en Vercel.

`npm run dev` regenera el cliente Prisma antes de iniciar Next.js. Si un servidor
ya estaba abierto durante un cambio de esquema, reinícialo para recargar los módulos
generados. La caché de desarrollo también compara el esquema del cliente antes de
reutilizar una instancia.

Las imágenes subidas se almacenan como bytes en PostgreSQL y se sirven desde
`GET /api/media/[id]`. No dependen del disco de Vercel ni de credenciales de otro
proveedor. La subida exige una sesión admin, limita el tamaño antes de procesar
multipart y verifica las firmas de JPEG, PNG y WebP. Las imágenes de negocios activos
son públicas. Quitar una imagen de la galería elimina su referencia; no borra el
archivo almacenado. Las URLs externas siguen dependiendo del proveedor original.

API nueva:

- `POST /api/businesses/[id]/images`: multipart con campo `file`; responde `{ id, url }`.
- `GET /api/media/[id]`: imagen pública de un negocio activo.
- `POST /api/track/service`: `{ linkId, tagCode?, source, eventType, targetId? }`.
- Los endpoints de servicios existentes aceptan `description`, `images` y `actions`.
- Analytics incorpora `serviceAccess` con servicio, tipo de información, evento y cantidad.

## Pruebas

`npm test` incluye validación de contenido, asociaciones de tags y eventos del carrusel.
`tests/service-flow.mjs` verifica el flujo real sobre una compilación de producción:
login, alta de servicio, subida de imágenes desde el dispositivo, persistencia, modal, contactos,
estadísticas y rechazo de subidas inválidas.

Esta prueba crea registros y rechaza conexiones que no apunten a `localhost` o
`127.0.0.1` con nombre de base **smartbiz_service_test**. Úsala únicamente con una
base desechable; no cambies esa protección para ejecutarla en producción.

```powershell
docker run --detach --rm --name smartbiz-service-test --publish 127.0.0.1:55439:5432 --env POSTGRES_PASSWORD=isolated-test-password --env POSTGRES_DB=smartbiz_service_test postgres:16-alpine
$env:DATABASE_URL='postgresql://postgres:isolated-test-password@127.0.0.1:55439/smartbiz_service_test'
npx.cmd prisma migrate deploy
npm.cmd run build
node tests/service-flow.mjs
docker stop smartbiz-service-test
```

La prueba utiliza Chrome instalado en su ubicación habitual de Windows o Chromium
de Playwright en otros entornos. Restaura `DATABASE_URL` al terminar o usa una
terminal dedicada a estas pruebas.
