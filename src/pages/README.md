# Pages

Sección para páginas transversales.

## App.js (Login clásico)
- Solicita `DNI` o `Código de boleta` para Alumno (sin contraseña) y redirige a `#/alumnos`.

## LoginAvanzado.js
- Formulario de acceso con `usuario` y `contraseña`.
- Reglas:
  - `administrador` + `admin` → `#/administrador`.
  - Usuario con solo dígitos (DNI, 8+ dígitos) → `#/docente` (requiere contraseña).
  - Usuario de tipo boleta (texto) → mostrar mensaje: usa el inicio clásico.
- Enlace para volver al login clásico en `/`.

## Rutas de acceso
- Por hash: `#/acceso`.
- Por ruta: `/192.168.0.1`.

## Estilos
- Reutiliza los estilos globales de `src/assets/css/App.css`.