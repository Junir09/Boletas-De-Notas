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

-- Tabla: boletas (códigos de acceso para alumnos)
CREATE TABLE IF NOT EXISTS `boletas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(64) NOT NULL,
  `dni` VARCHAR(20) NOT NULL,
  `estado` ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_boletas_codigo` (`codigo`),
  KEY `idx_boletas_dni` (`dni`)
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

-- Boletas (asociadas por DNI)
INSERT INTO `boletas` (`codigo`, `dni`, `estado`) VALUES
('BOLETA-44556677', '44556677', 'activo'),
('BOLETA-99887766', '99887766', 'activo');

-- Si prefieres insertar con `id` explícito (no recomendado con AUTO_INCREMENT),
-- usa este formato:
-- INSERT INTO `docente`(`id`, `dni`, `nombre`, `descripcion`, `password`) VALUES (1,'12345678','Juan Pérez','Profesor de Matemática','123456');
-- INSERT INTO `estudiantes`(`id`, `dni`, `apellidos`, `nombres`) VALUES (1,'44556677','Gómez Ramírez','Carlos');