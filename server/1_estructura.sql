-- Script de Estructura - ESTRATEGIA DEFINITIVA
-- Paso 1: Crear tablas SIN claves foráneas
-- Paso 2: Agregar claves foráneas al final
GENERATE_SOURCEMAP
false

USE `test`;

SET FOREIGN_KEY_CHECKS = 0;

-- Borrar todo para empezar limpio
DROP TABLE IF EXISTS `nota_historial`;
DROP TABLE IF EXISTS `promedio_detalle`;
DROP TABLE IF EXISTS `actividad_nota`;
DROP TABLE IF EXISTS `curso_actividad`;
DROP TABLE IF EXISTS `curso_grado`;
DROP TABLE IF EXISTS `docente_curso`;
DROP TABLE IF EXISTS `estudiantes`;
DROP TABLE IF EXISTS `docente`;
DROP TABLE IF EXISTS `cursos`;
DROP TABLE IF EXISTS `secciones`;
DROP TABLE IF EXISTS `grados`;

-- ---------------------------------------------------------
-- CREACIÓN DE TABLAS (SOLO COLUMNAS E ÍNDICES)
-- ---------------------------------------------------------

CREATE TABLE `grados` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_grados_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `secciones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_secciones_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cursos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cursos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `docente` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_docente_dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `estudiantes` (
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

CREATE TABLE `docente_curso` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) NOT NULL,
  `curso_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_docente_curso` (`dni`,`curso_id`),
  KEY `idx_docente_curso_dni` (`dni`),
  KEY `idx_docente_curso_curso` (`curso_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `curso_grado` (
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

CREATE TABLE `curso_actividad` (
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

CREATE TABLE `actividad_nota` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actividad_id` INT UNSIGNED NOT NULL,
  `estudiante_dni` VARCHAR(20) NOT NULL,
  `nota` DECIMAL(5,2) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_act_est` (`actividad_id`, `estudiante_dni`),
  KEY `idx_an_actividad` (`actividad_id`),
  KEY `idx_an_estudiante` (`estudiante_dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `promedio_detalle` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `promedio_id` INT UNSIGNED NOT NULL,
  `actividad_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_promedio_detalle` (`promedio_id`, `actividad_id`),
  KEY `idx_promedio_detalle_promedio` (`promedio_id`),
  KEY `idx_promedio_detalle_actividad` (`actividad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `nota_historial` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nota_id` INT UNSIGNED NOT NULL,
  `valor_anterior` DECIMAL(5,2) NULL,
  `valor_nuevo` DECIMAL(5,2) NULL,
  `fecha` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nh_nota` (`nota_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- AGREGAR CLAVES FORÁNEAS (AL FINAL)
-- ---------------------------------------------------------

ALTER TABLE `estudiantes`
  ADD CONSTRAINT `fk_est_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_est_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `docente_curso`
  ADD CONSTRAINT `fk_dc_docente` FOREIGN KEY (`dni`) REFERENCES `docente`(`dni`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dc_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `curso_grado`
  ADD CONSTRAINT `fk_cg_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cg_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cg_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `curso_actividad`
  ADD CONSTRAINT `fk_ca_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ca_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ca_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `actividad_nota`
  ADD CONSTRAINT `fk_an_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `curso_actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_an_estudiante` FOREIGN KEY (`estudiante_dni`) REFERENCES `estudiantes`(`dni`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `promedio_detalle`
  ADD CONSTRAINT `fk_pd_promedio` FOREIGN KEY (`promedio_id`) REFERENCES `curso_actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pd_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `curso_actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `nota_historial`
  ADD CONSTRAINT `fk_nh_nota` FOREIGN KEY (`nota_id`) REFERENCES `actividad_nota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
