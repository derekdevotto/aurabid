# AuraBid MVP

MVP construido con Next.js App Router y TypeScript, siguiendo la estructura del starter oficial de Next/Vercel.

## Ejecutar

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

## Incluye

- Leaderboard tipo Outbid con puesto #1 destacado.
- Oferta editable en bloques de +100 puntos de aura.
- Input de URL/@handle y selector de categorías.
- Reconocimiento local de `@usuario`, `x.com/usuario`, `twitter.com/usuario` y URLs normales, con enlace externo en cada entrada.
- Outbid demo que actualiza el ranking y el feed de actividad.
- Saldo de aura, paquetes demo y cobro de la diferencia si repetís tu @handle.
- Supabase como fuente compartida para temporadas, ofertas, actividad y presencia online.
- Realtime para refrescar el leaderboard y el feed sin recargar.
- Persistencia local solo para saldo, idioma y tema; el tablero ya no depende de un navegador.
- Selector i18n `ES / EN` persistente.
- Favicon `.ico` declarado explícitamente en metadata y marca raster transparente generada con IA.
- PayPal Orders v2 listo para sandbox o live según el entorno.
- Simulación local de pagos disponible cuando no hay credenciales PayPal configuradas.
- Vista con identidad propia en índigo/lima y modo oscuro.
- Layout responsive para móvil.

Los puntos son una moneda social ficticia: cada paquete de +100 aura cuesta US$1. El proyecto Supabase `aurabid` ya contiene la temporada inicial, las entradas seed, RLS y la publicación Realtime. La función de presencia pública está limitada al heartbeat del MVP; para producción conviene sumar autenticación, moderación, rate limiting y un flujo server-side de acreditación.

## Variables de entorno

1. Copiá `.env.example` como `.env.local`.
2. Completá las variables de PayPal con las credenciales del entorno elegido (`production` para Live o `sandbox`).
3. Dejá configuradas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para usar el tablero compartido.
4. Configurá `SUPABASE_SERVICE_ROLE_KEY` únicamente en el servidor para acreditar PayPal y procesar ofertas atómicamente. Nunca uses esa clave con `NEXT_PUBLIC_`.
5. Reiniciá `npm run dev` después de cambiar `.env.local`.

El servidor crea y captura las órdenes mediante las rutas `/api/paypal/orders` y `/api/paypal/orders/:orderId/capture`. El cliente nunca recibe el secreto de PayPal; la publishable key de Supabase se usa con RLS activo.
