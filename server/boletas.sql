-- Script SQL optimizado para TiDB Cloud / MySQL
-- Base de datos: Boletas

-- Nota: En TiDB Cloud Serverless, es posible que debas crear la base de datos manualmente
-- o usar la base de datos predeterminada 'test'.
CREATE DATABASE IF NOT EXISTS `boletas`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `boletas`;

-- Tabla: grados (Maestro)
CREATE TABLE IF NOT EXISTS `grados` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_grados_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: secciones (Maestro)
CREATE TABLE IF NOT EXISTS `secciones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_secciones_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `grado` TINYINT UNSIGNED NULL, -- Legacy
  `seccion` VARCHAR(10) NULL, -- Legacy
  `grado_id` INT UNSIGNED NULL,
  `seccion_id` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_estudiantes_dni` (`dni`),
  KEY `idx_estudiantes_grado_id` (`grado_id`),
  KEY `idx_estudiantes_seccion_id` (`seccion_id`),
  CONSTRAINT `fk_est_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_est_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: cursos
CREATE TABLE IF NOT EXISTS `cursos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cursos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: docente_curso
CREATE TABLE IF NOT EXISTS `docente_curso` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) NOT NULL,
  `curso_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_docente_curso` (`dni`,`curso_id`),
  KEY `idx_docente_curso_dni` (`dni`),
  KEY `idx_docente_curso_curso` (`curso_id`),
  CONSTRAINT `fk_dc_docente` FOREIGN KEY (`dni`) REFERENCES `docente`(`dni`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dc_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: curso_grado
CREATE TABLE IF NOT EXISTS `curso_grado` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `curso_id` INT UNSIGNED NOT NULL,
  `grado_id` INT UNSIGNED NOT NULL,
  `seccion_id` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_curso_grado_seccion` (`curso_id`,`grado_id`,`seccion_id`),
  KEY `idx_curso_grado_curso` (`curso_id`),
  KEY `idx_curso_grado_grado` (`grado_id`),
  KEY `idx_curso_grado_seccion` (`seccion_id`),
  CONSTRAINT `fk_cg_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cg_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cg_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: curso_actividad
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
  KEY `idx_ca_seccion` (`seccion_id`),
  CONSTRAINT `fk_ca_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ca_grado` FOREIGN KEY (`grado_id`) REFERENCES `grados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ca_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: actividad_nota
CREATE TABLE IF NOT EXISTS `actividad_nota` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actividad_id` INT UNSIGNED NOT NULL,
  `estudiante_dni` VARCHAR(20) NOT NULL,
  `nota` DECIMAL(5,2) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_act_est` (`actividad_id`, `estudiante_dni`),
  KEY `idx_an_actividad` (`actividad_id`),
  KEY `idx_an_estudiante` (`estudiante_dni`),
  CONSTRAINT `fk_an_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `curso_actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_an_estudiante` FOREIGN KEY (`estudiante_dni`) REFERENCES `estudiantes`(`dni`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: promedio_detalle
CREATE TABLE IF NOT EXISTS `promedio_detalle` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `promedio_id` INT UNSIGNED NOT NULL,
  `actividad_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_promedio_detalle` (`promedio_id`, `actividad_id`),
  KEY `idx_promedio_detalle_promedio` (`promedio_id`),
  KEY `idx_promedio_detalle_actividad` (`actividad_id`),
  CONSTRAINT `fk_pd_promedio` FOREIGN KEY (`promedio_id`) REFERENCES `curso_actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pd_actividad` FOREIGN KEY (`actividad_id`) REFERENCES `curso_actividad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: nota_historial
CREATE TABLE IF NOT EXISTS `nota_historial` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nota_id` INT UNSIGNED NOT NULL,
  `valor_anterior` DECIMAL(5,2) NULL,
  `valor_nuevo` DECIMAL(5,2) NULL,
  `fecha` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nh_nota` (`nota_id`),
  CONSTRAINT `fk_nh_nota` FOREIGN KEY (`nota_id`) REFERENCES `actividad_nota`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos iniciales (Semilla)
INSERT IGNORE INTO grados (nombre) VALUES ('1°'), ('2°'), ('3°'), ('4°'), ('5°'), ('6°');
INSERT IGNORE INTO secciones (nombre) VALUES ('A'), ('B'), ('C');