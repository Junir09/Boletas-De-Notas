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

ALTER TABLE `docente_curso`
  ADD CONSTRAINT `fk_dc_docente` FOREIGN KEY (`dni`) REFERENCES `docente`(`dni`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dc_curso` FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `grados` (`nombre`) VALUES ('1°'), ('2°'), ('3°'), ('4°'), ('5°'), ('6°');
INSERT IGNORE INTO `secciones` (`nombre`) VALUES ('A'), ('B');
INSERT IGNORE INTO `cursos` (`nombre`, `descripcion`) VALUES ('Matemática', NULL), ('Comunicación', NULL), ('Ciencias', NULL);
INSERT IGNORE INTO `docente` (`dni`, `nombre`, `descripcion`, `password`) VALUES
  ('12345678', 'Juan Pérez', NULL, '654321'),
  ('87654321', 'María López', NULL, '123456');
INSERT IGNORE INTO `docente_curso` (`dni`, `curso_id`) SELECT '12345678', c.id FROM `cursos` c WHERE c.`nombre` = 'Matemática';
INSERT IGNORE INTO `docente_curso` (`dni`, `curso_id`) SELECT '87654321', c.id FROM `cursos` c WHERE c.`nombre` = 'Comunicación';

INSERT IGNORE INTO `estudiantes` (`dni`, `apellidos`, `nombres`, `grado`, `seccion`) VALUES
  ('15837237', 'Castro García', 'Sofía', 1, 'A'),
  ('34871792', 'Castro López', 'Luis', 1, 'A'),
  ('21178702', 'Díaz Rojas', 'Andrea', 1, 'A'),
  ('51526326', 'Flores Mendoza', 'Carlos', 1, 'A'),
  ('60859754', 'Flores Salazar', 'Mariana', 1, 'A'),
  ('29052448', 'Flores Pérez', 'Jorge', 1, 'A')
ON DUPLICATE KEY UPDATE `apellidos`=VALUES(`apellidos`), `nombres`=VALUES(`nombres`), `grado`=VALUES(`grado`), `seccion`=VALUES(`seccion`);

INSERT IGNORE INTO `curso_grado` (`curso_id`, `grado_id`, `seccion_id`)
SELECT c.id, g.id, s.id FROM `cursos` c JOIN `grados` g ON g.`nombre` = '1°' JOIN `secciones` s ON s.`nombre` = 'A' WHERE c.`nombre` = 'Matemática';

UPDATE `curso_actividad` SET `nombre`='Práctica' WHERE `nombre`='PRACTICA';
UPDATE `curso_actividad` SET `nombre`='Tarea' WHERE `nombre`='XXX';
UPDATE `curso_actividad` SET `nombre`='Examen' WHERE `nombre`='OÑO';
UPDATE `curso_actividad` SET `nombre`='Unidad 1' WHERE `nombre`='UNIDAD 1';
INSERT INTO `curso_actividad` (`curso_id`, `grado_id`, `seccion_id`, `nombre`, `orden`)
SELECT c.id, g.id, s.id, 'Práctica', 1 FROM `cursos` c JOIN `grados` g ON g.`nombre`='1°' JOIN `secciones` s ON s.`nombre`='A' WHERE c.`nombre`='Matemática' AND NOT EXISTS(
  SELECT 1 FROM `curso_actividad` ca WHERE ca.`curso_id`=c.id AND ca.`grado_id`=g.id AND ca.`seccion_id`=s.id AND ca.`nombre`='Práctica'
);
INSERT INTO `curso_actividad` (`curso_id`, `grado_id`, `seccion_id`, `nombre`, `orden`)
SELECT c.id, g.id, s.id, 'Tarea', 2 FROM `cursos` c JOIN `grados` g ON g.`nombre`='1°' JOIN `secciones` s ON s.`nombre`='A' WHERE c.`nombre`='Matemática' AND NOT EXISTS(
  SELECT 1 FROM `curso_actividad` ca WHERE ca.`curso_id`=c.id AND ca.`grado_id`=g.id AND ca.`seccion_id`=s.id AND ca.`nombre`='Tarea'
);
INSERT INTO `curso_actividad` (`curso_id`, `grado_id`, `seccion_id`, `nombre`, `orden`)
SELECT c.id, g.id, s.id, 'Examen', 3 FROM `cursos` c JOIN `grados` g ON g.`nombre`='1°' JOIN `secciones` s ON s.`nombre`='A' WHERE c.`nombre`='Matemática' AND NOT EXISTS(
  SELECT 1 FROM `curso_actividad` ca WHERE ca.`curso_id`=c.id AND ca.`grado_id`=g.id AND ca.`seccion_id`=s.id AND ca.`nombre`='Examen'
);
INSERT INTO `curso_actividad` (`curso_id`, `grado_id`, `seccion_id`, `nombre`, `orden`)
SELECT c.id, g.id, s.id, 'Unidad 1', 4 FROM `cursos` c JOIN `grados` g ON g.`nombre`='1°' JOIN `secciones` s ON s.`nombre`='A' WHERE c.`nombre`='Matemática' AND NOT EXISTS(
  SELECT 1 FROM `curso_actividad` ca WHERE ca.`curso_id`=c.id AND ca.`grado_id`=g.id AND ca.`seccion_id`=s.id AND ca.`nombre`='Unidad 1'
);

INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '15837237', 20.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='PRACTICA';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '15837237', 15.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='XXX';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '15837237', 5.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='OÑO';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '15837237', 11.67 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='UNIDAD 1';

INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 10.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='PRACTICA';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 20.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='XXX';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 4.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='OÑO';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 11.33 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='UNIDAD 1';
