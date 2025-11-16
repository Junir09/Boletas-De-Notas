-- Script SQL para XAMPP (MySQL/MariaDB)
-- Base de datos: Boletas

-- Crear BD si no existe
CREATE DATABASE IF NOT EXISTS `Boletas`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `Boletas`;

-- Tabla: docente
CREATE TABLE IF NOT EXISTS `docente` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_docente_dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: estudiantes
CREATE TABLE IF NOT EXISTS `estudiantes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) NOT NULL,
  `apellidos` VARCHAR(150) NOT NULL,
  `nombres` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_estudiantes_dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: cursos
CREATE TABLE IF NOT EXISTS `cursos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cursos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: docente_curso (asignaciones)
CREATE TABLE IF NOT EXISTS `docente_curso` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) NOT NULL,
  `curso_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_docente_curso` (`dni`,`curso_id`),
  KEY `idx_docente_curso_dni` (`dni`),
  KEY `idx_docente_curso_curso` (`curso_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ejemplos de inserciones (puedes ajustar según tus datos reales)
-- Nota: si usas AUTO_INCREMENT, no es necesario pasar `id`.

-- Docentes
INSERT INTO `docente` (`dni`, `nombre`, `descripcion`, `password`) VALUES
('12345678', 'Juan Pérez', 'Profesor de Matemática', '123456'),
('87654321', 'María López', 'Profesor de Lenguaje', 'abcdef');

-- Estudiantes
INSERT INTO `estudiantes` (`dni`, `apellidos`, `nombres`) VALUES
('44556677', 'Gómez Ramírez', 'Carlos'),
('99887766', 'Suárez Díaz', 'Ana');

-- Cursos
INSERT INTO `cursos` (`nombre`, `descripcion`) VALUES
('Matemática', 'Curso de Matemática básica'),
('Lenguaje', 'Curso de Lenguaje y Comunicación');

-- Asignaciones de cursos a docentes (asumiendo IDs autogenerados)
INSERT INTO `docente_curso` (`dni`, `curso_id`) VALUES
('12345678', 1),
('87654321', 2);

-- Si prefieres insertar con `id` explícito (no recomendado con AUTO_INCREMENT),
-- usa este formato:
-- INSERT INTO `docente`(`id`, `dni`, `nombre`, `descripcion`, `password`) VALUES (1,'12345678','Juan Pérez','Profesor de Matemática','123456');
-- INSERT INTO `estudiantes`(`id`, `dni`, `apellidos`, `nombres`) VALUES (1,'44556677','Gómez Ramírez','Carlos');