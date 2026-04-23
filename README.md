# Siembra Basketball Buin — App

App de gestión para el club Siembra Basketball Buin. Desarrollada con Next.js, Supabase y OneSignal.

## Stack
- **Frontend:** Next.js 14
- **Base de datos + Auth:** Supabase
- **Notificaciones:** OneSignal
- **Deploy:** Vercel

## Variables de entorno (configurar en Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://qsytywaxwtdphoutaazt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wIVi7AjK57VPR0-7PhMcIQ_WZbTW1g1
NEXT_PUBLIC_ONESIGNAL_APP_ID=13918c21-2d44-4ee7-9543-08a305057367
ONESIGNAL_REST_API_KEY=tu_onesignal_rest_api_key
```

## Configuración Supabase

1. Ir a **SQL Editor** en Supabase
2. Ejecutar el contenido de `supabase-schema.sql`
3. Subir el logo del club en **Storage → logo → upload**

## Funcionalidades

### Perfil Entrenador
- Dashboard con métricas clave
- Gestión de fichas de alumnos (CRUD + exportar Excel)
- Registro de evaluaciones (velocidad, fuerza, potencia, resistencia)
- Calendario de entrenamientos
- Control de asistencia diario
- Portal de pagos (verificar comprobantes)

### Perfil Alumno
- Dashboard personal
- Ver mi ficha
- Ver mis evaluaciones y progreso
- Ver calendario de entrenamientos
- Ver mi asistencia
- Subir comprobante de pago mensual

## Categorías
- U13, U14, U15, U17, U18, U19, Adulto (asignadas automáticamente por fecha de nacimiento)
