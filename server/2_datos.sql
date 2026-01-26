-- Script SQL para XAMPP (MySQL/MariaDB) - PARTE 2: DATOS
-- Asegúrate de haber ejecutado la PARTE 1 primero

USE `test`;

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
SELECT ca.id, '15837237', 20.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Práctica';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '15837237', 15.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Tarea';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '15837237', 5.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Examen';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '15837237', 11.67 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Unidad 1';

INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 10.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Práctica';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 20.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Tarea';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 4.00 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Examen';
INSERT INTO `actividad_nota` (`actividad_id`, `estudiante_dni`, `nota`)
SELECT ca.id, '34871792', 11.33 FROM `curso_actividad` ca JOIN `cursos` c ON c.id = ca.curso_id JOIN `grados` g ON g.id = ca.grado_id JOIN `secciones` s ON s.id = ca.seccion_id WHERE c.`nombre`='Matemática' AND g.`nombre`='1°' AND s.`nombre`='A' AND ca.`nombre`='Unidad 1';
