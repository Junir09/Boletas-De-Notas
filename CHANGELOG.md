# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [2.0.0] - 2024-11-25

### ✨ Nuevas Funcionalidades

#### Panel de Administrador
- **Página de Inicio Mejorada**: Cards interactivas clickeables con acceso rápido a todas las funciones
- **Búsqueda por DNI**: En Asignar Grados con scroll automático y highlight visual
- **Menú Desplegable**: En Lista de Docentes con posicionamiento inteligente
- **Campo Sección**: Agregado en Asignar Grados para asignación completa
- **CRUD de Grados**: Gestión dinámica sin límites hardcoded
- **CRUD de Secciones**: Gestión completa de secciones (A, B, C, etc.)
- **Grados Dinámicos**: Sincronización automática entre Configuración y Asignar Grados

#### Base de Datos
- Nueva tabla `grados` con 6 grados por defecto
- Nueva tabla `secciones` con 3 secciones por defecto
- Columna `seccion` agregada a tabla `estudiantes`
- Auto-creación de tablas y datos por defecto al iniciar servidor

#### API
- Endpoints CRUD para grados: GET, POST, PUT, DELETE `/api/grados`
- Endpoints CRUD para secciones: GET, POST, PUT, DELETE `/api/secciones`
- Endpoint actualizado para incluir sección en asignación masiva
- Endpoint de estudiantes ahora retorna grado y sección

### 🎨 Mejoras de Diseño

#### Layout y Navegación
- **Sidebar Sticky**: Permanece visible al hacer scroll
- **Contenido Centrado**: Anchos máximos apropiados por sección
- **Scrollbar Personalizado**: En sidebar con colores del tema

#### Estilos Creados
- `inicio.css` - Página de bienvenida con cards
- `registrar-docentes.css` - Formulario de registro
- `lista-estudiantes.css` - Tabla con badges
- `lista-docentes.css` - Tabla con menú desplegable
- `cursos.css` - Gestión de cursos
- `configuracion.css` - Config con CRUD tables
- `asignargrados.css` - Asignación con búsqueda
- `docentehome.css` - Panel docente completo

#### Componentes Visuales
- **Badges**: Para grado y sección en Lista de Estudiantes
- **Menú Desplegable**: Con backdrop y animaciones
- **Search Box**: Con highlight animado
- **Cards Interactivas**: Con hover effects y cursor pointer
- **Botones Mejorados**: Estados hover, active y focus

### 🔧 Mejoras Técnicas

#### Frontend
- Eliminación de código duplicado
- Optimización de renders
- Mejor manejo de estados
- Validaciones mejoradas
- Sin warnings de React/ESLint

#### Backend
- Validaciones de datos mejoradas
- Manejo de errores consistente
- Endpoints RESTful completos
- Auto-migración de base de datos

### 📝 Documentación
- README.md completamente actualizado
- Estructura del proyecto documentada
- Endpoints API documentados
- Guía de instalación mejorada
- CHANGELOG.md creado
- package.json actualizado con metadata

### 🐛 Correcciones
- Sidebar ahora permanece fijo al hacer scroll
- Menú desplegable visible en todas las posiciones
- Grados sin límite hardcoded
- Overflow de tablas corregido
- Keys de React corregidas
- Imports no utilizados eliminados

## [1.0.0] - 2024-11-01

### Funcionalidades Iniciales
- Sistema de login con tres roles
- Panel de Administrador básico
- Panel de Docente básico
- Panel de Alumno básico
- Registro de estudiantes
- Registro de docentes
- Gestión de cursos
- API REST básica
- Base de datos MySQL
