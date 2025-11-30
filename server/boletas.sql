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

-- Tabla: estudiantes (incluye FKs por id de grado y sección)
CREATE TABLE IF NOT EXISTS `estudiantes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) NOT NULL,
  `apellidos` VARCHAR(150) NOT NULL,
  `nombres` VARCHAR(150) NOT NULL,
  `grado` TINYINT UNSIGNED NULL,
  `seccion` VARCHAR(10) NULL,
  `grado_id` INT UNSIGNED NULL,
  `seccion_id` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_estudiantes_dni` (`dni`),
  KEY `idx_estudiantes_grado_id` (`grado_id`),
  KEY `idx_estudiantes_seccion_id` (`seccion_id`)
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

-- Tabla: curso_grado (asignación de cursos por grado y sección)
CREATE TABLE IF NOT EXISTS `curso_grado` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `curso_id` INT UNSIGNED NOT NULL,
  `grado_id` INT UNSIGNED NOT NULL,
  `seccion_id` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_curso_grado_seccion` (`curso_id`,`grado_id`,`seccion_id`),
  KEY `idx_curso_grado_curso` (`curso_id`),
  KEY `idx_curso_grado_grado` (`grado_id`),
  KEY `idx_curso_grado_seccion` (`seccion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: grados
CREATE TABLE IF NOT EXISTS `grados` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_grados_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: secciones
CREATE TABLE IF NOT EXISTS `secciones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_secciones_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `curso_actividad` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `curso_id` INT UNSIGNED NOT NULL,
  `grado_id` INT UNSIGNED NOT NULL,
  `seccion_id` INT UNSIGNED NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `orden` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ca_curso` (`curso_id`),
  KEY `idx_ca_grado` (`grado_id`),
  KEY `idx_ca_seccion` (`seccion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `actividad_nota` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actividad_id` INT UNSIGNED NOT NULL,
  `estudiante_dni` VARCHAR(20) NOT NULL,
  `nota` DECIMAL(5,2) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_act_est` (`actividad_id`, `estudiante_dni`),
  KEY `idx_an_actividad` (`actividad_id`),
  KEY `idx_an_estudiante` (`estudiante_dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `curso_grado`
  ADD CONSTRAINT `fk_cg_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cg_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cg_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `estudiantes`
  ADD CONSTRAINT `fk_est_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_est_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `curso_actividad`
  ADD CONSTRAINT `fk_ca_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ca_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ca_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `actividad_nota`
  ADD CONSTRAINT `fk_an_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `curso_actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_an_estudiante` FOREIGN KEY (`estudiante_dni`) REFERENCES `estudiantes`(`dni`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Ejemplos de inserciones (puedes ajustar según tus datos reales)
-- Nota: si usas AUTO_INCREMENT, no es necesario pasar `id`.

-- Docentes
INSERT INTO `docente` (`dni`, `nombre`, `descripcion`, `password`) VALUES
('12345678', 'Juan Pérez', 'Profesor de Matemática', '123456'),
('87654321', 'María López', 'Profesor de Lenguaje', 'abcdef');

-- Estudiantes
INSERT INTO `estudiantes` (`dni`, `apellidos`, `nombres`, `grado`, `seccion`, `grado_id`, `seccion_id`) VALUES
('44556677', 'Gómez Ramírez', 'Carlos', 1, 'A', 1, 1),
('99887766', 'Suárez Díaz', 'Ana', 1, 'A', 1, 1);

-- Cursos
INSERT INTO `cursos` (`nombre`, `descripcion`) VALUES
('Matemática', 'Curso de Matemática básica'),
('Lenguaje', 'Curso de Lenguaje y Comunicación');

-- Grados por defecto (1° a 6°)
INSERT INTO `grados` (`nombre`) VALUES
('1°'),
('2°'),
('3°'),
('4°'),
('5°'),
('6°');

-- Secciones por defecto (A, B, C)
INSERT INTO `secciones` (`nombre`) VALUES
('A'),
('B'),
('C');

-- Asignaciones de cursos a docentes (asumiendo IDs autogenerados)
INSERT INTO `docente_curso` (`dni`, `curso_id`) VALUES
('12345678', 1),
('87654321', 2);

-- Asignaciones de cursos por grado y sección (ejemplo)
INSERT INTO `curso_grado` (`curso_id`, `grado_id`, `seccion_id`) VALUES
(1, 1, 1);

-- Si prefieres insertar con `id` explícito (no recomendado con AUTO_INCREMENT),
-- usa este formato:
-- INSERT INTO `docente`(`id`, `dni`, `nombre`, `descripcion`, `password`) VALUES (1,'12345678','Juan Pérez','Profesor de Matemática','123456');
-- INSERT INTO `estudiantes`(`id`, `dni`, `apellidos`, `nombres`) VALUES (1,'44556677','Gómez Ramírez','Carlos');
