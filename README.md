# Sistema de Gestión de Boletas de Notas

Sistema web completo para la gestión de boletas de notas escolares con tres roles de usuario: Administrador, Docente y Alumno. Incluye gestión de estudiantes, docentes, cursos, grados y secciones con interfaz moderna y responsive.

## Características Principales

### Panel de Administrador
- ✅ **Página de Inicio**: Cards interactivas con acceso rápido a todas las funciones
- ✅ **Registrar Estudiantes**: Registro individual o masivo (Excel/CSV)
- ✅ **Registrar Docentes**: Alta de docentes con generación automática de credenciales
- ✅ **Lista de Estudiantes**: Visualización completa con grado y sección
- ✅ **Lista de Docentes**: Gestión con menú desplegable de acciones
- ✅ **Asignar Grados**: Asignación de grados y secciones con búsqueda por DNI
- ✅ **Gestión de Cursos**: CRUD completo de cursos y asignación a docentes
- ✅ **Configuración del Sistema**: 
  - Personalización de título y logo
  - CRUD de grados (dinámico, sin límites)
  - CRUD de secciones (A, B, C, etc.)

### Panel de Docente
- ✅ Visualización de cursos asignados
- ✅ Gestión de notas (en desarrollo)
- ✅ Generación de reportes (en desarrollo)

### Panel de Alumno
- ✅ Consulta de notas
- ✅ Visualización de boletas
- ✅ Perfil del estudiante

## Estructura del Proyecto

```
Boletas-De-Notas/
├── src/
│   ├── administrador/
│   │   ├── AdminHome.js              # Panel principal con navegación
│   │   ├── RegistrarEstudiantes.js   # Registro masivo/individual
│   │   ├── RegistrarDocentes.js      # Alta de docentes
│   │   ├── ListaEstudiantes.js       # Tabla con grado/sección
│   │   ├── ListaDocentes.js          # Gestión con menú desplegable
│   │   ├── AsignarGrados.js          # Asignación con búsqueda
│   │   ├── Cursos.js                 # CRUD de cursos
│   │   └── ConfiguracionSistema.js   # Config + CRUD grados/secciones
│   ├── Docente/
│   │   └── DocenteHome.js            # Panel docente
│   ├── Alumnos/
│   │   └── AlumnosHome.js            # Panel alumno
│   ├── pages/
│   │   └── LoginAvanzado.js          # Login con credenciales
│   ├── assets/
│   │   └── css/
│   │       ├── basestyles.css        # Variables CSS globales
│   │       ├── admin/
│   │       │   ├── layout.css        # Layout centrado
│   │       │   ├── sidebar.css       # Sidebar sticky
│   │       │   ├── inicio.css        # Cards de inicio
│   │       │   ├── components.css    # Componentes comunes
│   │       │   └── [otros].css       # Estilos por sección
│   │       └── docentehome.css       # Estilos panel docente
│   ├── App.js                        # Enrutamiento principal
│   └── api.js                        # Helper para API calls
├── server/
│   ├── index.js                      # API Express
│   ├── db.js                         # Conexión MySQL
│   ├── boletas.sql                   # Schema completo
│   └── package.json
└── package.json
```

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

## Base de Datos

### Tablas Principales
- **estudiantes**: DNI, apellidos, nombres, grado, sección
- **docente**: DNI, nombre, descripción, password
- **cursos**: ID, nombre, descripción
- **grados**: ID, número, nombre (dinámico)
- **secciones**: ID, nombre (dinámico)
- **docente_curso**: Relación docente-curso (1 curso = 1 docente)

### Configuración
1. Importa `server/boletas.sql` en MySQL/XAMPP
2. Configura credenciales en `server/db.js`
3. El servidor crea automáticamente:
   - 6 grados por defecto (1° a 6°)
   - 3 secciones por defecto (A, B, C)

## Backend (API)

### Instalación
```bash
cd server
npm install
npm start  # Puerto 5000 por defecto
```

### Endpoints Principales

#### Autenticación
- `POST /api/login/docente` → `{ dni, password }`
- `POST /api/login/alumno` → `{ dni }`

#### Estudiantes
- `GET /api/estudiantes` → Lista todos los estudiantes
- `POST /api/estudiantes` → Crear estudiante individual
- `POST /api/estudiantes/bulk` → Importación masiva
- `PUT /api/estudiantes/:dni` → Actualizar estudiante
- `DELETE /api/estudiantes/:dni` → Eliminar estudiante
- `POST /api/estudiantes/grados/bulk` → Asignar grado/sección masivo
- `POST /api/estudiantes/grados/promover` → Promover grado
- `POST /api/estudiantes/grados/bajar` → Bajar grado

#### Docentes
- `GET /api/docentes` → Lista todos los docentes
- `POST /api/docentes` → Crear docente
- `PUT /api/docentes/:dni` → Actualizar docente
- `DELETE /api/docentes/:dni` → Eliminar docente
- `GET /api/docentes/:dni/cursos` → Cursos asignados

#### Cursos
- `GET /api/cursos` → Lista todos los cursos
- `GET /api/cursos/disponibles` → Cursos sin asignar
- `POST /api/cursos` → Crear curso
- `PUT /api/cursos/:id` → Actualizar curso
- `DELETE /api/cursos/:id` → Eliminar curso

#### Asignaciones
- `POST /api/asignaciones` → Asignar curso a docente
- `DELETE /api/asignaciones` → Quitar asignación

#### Grados y Secciones
- `GET /api/grados` → Lista grados
- `POST /api/grados` → Crear grado
- `PUT /api/grados/:id` → Actualizar grado
- `DELETE /api/grados/:id` → Eliminar grado
- `GET /api/secciones` → Lista secciones
- `POST /api/secciones` → Crear sección
- `PUT /api/secciones/:id` → Actualizar sección
- `DELETE /api/secciones/:id` → Eliminar sección

## Instalación y Desarrollo

### Frontend
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Acceder en el navegador
http://localhost:3000
```

### Backend
```bash
# Navegar a la carpeta del servidor
cd server

# Instalar dependencias
npm install

# Iniciar API
npm start

# API disponible en
http://localhost:5000
```

### Base de Datos
1. Inicia XAMPP (Apache + MySQL)
2. Abre phpMyAdmin
3. Crea la base de datos `Boletas`
4. Importa `server/boletas.sql`
5. El servidor creará automáticamente las tablas y datos por defecto

## Tecnologías Utilizadas

### Frontend
- **React** 18.x
- **Lucide React** - Iconos
- **XLSX** - Importación/exportación Excel
- **CSS Variables** - Sistema de diseño consistente

### Backend
- **Node.js** + **Express**
- **MySQL** (compatible con XAMPP)
- **mysql2** - Driver MySQL

## Diseño y UX

### Sistema de Colores
```css
--color-principal: #102844    /* Azul oscuro */
--color-hover: #114a87        /* Azul medio */
--color-accent: #2563eb       /* Azul brillante */
--color-fondo: #f5f7fb        /* Gris claro */
--color-success: #10b981      /* Verde */
--color-danger: #f87171       /* Rojo */
```

### Características de Diseño
- ✅ Sidebar sticky (permanece visible al hacer scroll)
- ✅ Contenido centrado con anchos máximos apropiados
- ✅ Cards interactivas con hover effects
- ✅ Menús desplegables con backdrop
- ✅ Badges visuales para estados
- ✅ Animaciones suaves y transiciones
- ✅ Responsive design

## Funcionalidades Destacadas

### Importación Masiva de Estudiantes
- Soporta archivos Excel (.xlsx) y CSV
- Detecta automáticamente el formato
- Maneja BOM UTF-8 para compatibilidad
- Separa apellidos y nombres automáticamente
- Exporta plantillas para facilitar el llenado

### Búsqueda Inteligente
- Búsqueda por DNI en Asignar Grados
- Scroll automático al estudiante encontrado
- Highlight visual con animación
- Selección automática

### Gestión Dinámica de Grados
- Sin límites hardcoded
- Sincronización automática entre módulos
- CRUD completo desde Configuración
- Agrupación dinámica en Asignar Grados

### Menú Desplegable Inteligente
- Posicionamiento automático (arriba/abajo)
- Cierre con backdrop transparente
- Iconos descriptivos
- Animaciones suaves

## Credenciales por Defecto

### Administrador
- Usuario: `administrador`
- Contraseña: `admin`

### Docentes
- Usuario: DNI del docente
- Contraseña: Últimos 6 dígitos del DNI (generada automáticamente)

### Alumnos
- Acceso con DNI (sin contraseña)

## Próximas Funcionalidades

- [ ] Gestión de notas por docente
- [ ] Generación de boletas en PDF
- [ ] Reportes estadísticos
- [ ] Notificaciones por email
- [ ] Backup automático de base de datos
- [ ] Historial de cambios
- [ ] Exportación de reportes

## Contribución

Este proyecto está en desarrollo activo. Para contribuir:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
