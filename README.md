# Boleta de Notas – Documentación del Proyecto

Este proyecto permite iniciar sesión y navegar por paneles según rol (Administrador, Docente y Alumno), con dos modos de acceso: clásico y avanzado.

## Estructura de Carpetas

- `src/administrador/`
  - `AdminHome.js`: Vista principal del Administrador con menú lateral.
  - `README.md`: Descripción de la sección y navegación.
- `src/Docente/`
  - `DocenteHome.js`: Vista principal del Docente con menú lateral.
  - `README.md`: Descripción de la sección y navegación.
- `src/Alumnos/`
  - `AlumnosHome.js`: Vista principal del Alumno con menú lateral.
  - `README.md`: Descripción de la sección y navegación.
- `src/pages/`
  - `LoginAvanzado.js`: Formulario de acceso por usuario/contraseña.
  - `README.md`: Explicación del acceso avanzado y reglas.
- `src/assets/css/`
  - `App.css`: Estilos globales y del layout con sidebar.
  - `index.css`: Estilos base del proyecto.
- `src/assets/images/`
  - `logo.svg`: Recursos gráficos.
- `src/App.js`: Enrutado por hash y por ruta, y login clásico.
- `src/index.js`: Bootstrap de la aplicación.

## Flujos de Inicio de Sesión

- Login clásico (en `/`):
  - Pide `DNI` o `Código de boleta` (Alumno), sin contraseña.
  - Envía `{ dni }` o `{ boleta }` al backend y redirige a `#/alumnos`.

- Login avanzado:
  - Por ruta: `http://localhost:3001/192.168.0.1`.
  - Por hash: `http://localhost:3001/#/acceso`.
  - Reglas:
    - Usuario `administrador` y contraseña `admin` → `#/administrador`.
    - Usuario con solo dígitos (DNI, 8+ dígitos) + contraseña → `#/docente`.
    - Usuario tipo boleta (texto) → usar login clásico (se muestra mensaje).
  - Incluye enlace para ir al login clásico (`/`).

## Rutas Disponibles

- `#/administrador` → Panel Administrador (sidebar con Dashboard, Usuarios, Boletas, Configuración).
- `#/docente` → Panel Docente (sidebar con Mis cursos, Boletas, Reportes).
- `#/alumnos` → Panel Alumno (sidebar con Mis notas, Boletas, Perfil).
- `#/acceso` → Login avanzado por hash.
- `/192.168.0.1` → Login avanzado por ruta.

## Estilos y Layout

- El layout de paneles usa `.layout` (grid de 2 columnas), `.sidebar` (menú lateral) y `.content` (contenido principal). Estos estilos están en `src/assets/css/App.css`.

## Backend (API) y Base de Datos

- Backend en `server/` (Node/Express + MySQL, compatible con XAMPP).
- Configuración:
  - Importa `server/sql/schema.sql` y `server/sql/seed.sql` en MySQL.
  - Copia `server/.env.example` a `server/.env` y ajusta credenciales (`DB_USER`, `DB_PASSWORD`, `DB_NAME`).
  - Instala dependencias: `cd server && npm install`.
  - Ejecuta la API: `npm start` (por defecto en `http://localhost:5000`).
- Endpoints:
  - `POST /api/login/docente` → `{ dni, password }`
  - `POST /api/login/alumno` → `{ boleta }`
- Integración:
  - Login clásico (Alumno) usa solo boleta y redirige a `#/alumnos`.
  - Login avanzado mantiene `administrador/admin` local y llama API para Docente.

## Desarrollo

- Ejecuta `npm start` en `Boleta-De-Notas`.
- Accede al navegador por la URL que se informe como `Local` u `On Your Network`.

## Notas

- Si prefieres rutas sin hash (por ejemplo `/docente` y `/administrador`), se puede integrar `react-router-dom`.
- En `192.168.0.1` normalmente corresponde al router; usa la IP de tu PC si quieres acceder desde otros dispositivos (la que muestra el servidor como `On Your Network`).
