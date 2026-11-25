-- migramos --
ALTER TABLE denuncias_imagenes ADD COLUMN IF NOT EXISTS estado VARCHAR(12) NOT NULL DEFAULT 'pendiente';

-- fecha default y not null en la base --
ALTER TABLE usuarios ALTER COLUMN fecha_registro SET DEFAULT now(), ALTER COLUMN fecha_registro SET NOT NULL;
ALTER TABLE publicaciones ALTER COLUMN fecha_creacion SET DEFAULT now(), ALTER COLUMN fecha_creacion SET NOT NULL;
ALTER TABLE comentarios ALTER COLUMN fecha SET DEFAULT now(), ALTER COLUMN fecha SET NOT NULL;
ALTER TABLE denuncias_imagenes ALTER COLUMN fecha SET DEFAULT now(), ALTER COLUMN fecha SET NOT NULL;
ALTER TABLE denuncias_comentarios ALTER COLUMN fecha SET DEFAULT now(), ALTER COLUMN fecha SET NOT NULL;
ALTER TABLE intereses ALTER COLUMN fecha SET DEFAULT now(), ALTER COLUMN fecha SET NOT NULL;
ALTER TABLE seguimientos ALTER COLUMN fecha SET DEFAULT now(), ALTER COLUMN fecha SET NOT NULL;
ALTER TABLE notificaciones ALTER COLUMN fecha SET DEFAULT now(), ALTER COLUMN fecha SET NOT NULL;
ALTER TABLE mensajes_privados ALTER COLUMN fecha SET DEFAULT now(), ALTER COLUMN fecha SET NOT NULL;

-- check --
ALTER TABLE valoraciones DROP CONSTRAINT IF EXISTS ck_valoraciones_puntuacion;
ALTER TABLE valoraciones ADD CONSTRAINT ck_valoraciones_puntuacion CHECK (puntuacion BETWEEN 1 AND 5);

ALTER TABLE seguimientos DROP CONSTRAINT IF EXISTS ck_seguimientos_no_autoseguimientos;
ALTER TABLE seguimientos ADD CONSTRAINT ck_seguimientos_no_autoseguimientos CHECK(seguidor_id <> seguido_id);

ALTER TABLE imagenes DROP CONSTRAINT IF EXISTS ck_imagenes_valoracion;
ALTER TABLE imagenes ADD CONSTRAINT ck_imagenes_valoracion CHECK (promedio_valoracion BETWEEN 0 AND 5 AND total_votos >= 0);

ALTER TABLE denuncias_imagenes DROP CONSTRAINT IF EXISTS ck_denuncias_imagenes_estado;
ALTER TABLE denuncias_imagenes ADD CONSTRAINT ck_denuncias_imagenes_estado CHECK (estado IN ('pendiente', 'desestimada', 'aceptada'));

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS ck_usuarios_email;
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_email CHECK (position('@' IN email) > 1);

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS ck_usuarios_nombre;
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_nombre CHECK (char_length(btrim(nombre)) > 0);

ALTER TABLE publicaciones DROP CONSTRAINT IF EXISTS ck_publicaciones_titulo;
ALTER TABLE publicaciones ADD CONSTRAINT ck_publicaciones_titulo CHECK (char_length(btrim(titulo)) > 0);

ALTER TABLE comentarios DROP CONSTRAINT IF EXISTS ck_comentarios_texto;
ALTER TABLE comentarios ADD CONSTRAINT ck_comentarios_texto CHECK (char_length(btrim(texto)) > 0);

ALTER TABLE etiquetas DROP CONSTRAINT IF EXISTS ck_etiquetas_nombre;
ALTER TABLE etiquetas ADD CONSTRAINT ck_etiquetas_nombre CHECK (char_length(btrim(nombre)) > 0);

ALTER TABLE mensajes_privados DROP CONSTRAINT IF EXISTS ck_mensajes_distinto_destinatario;
ALTER TABLE mensajes_privados ADD CONSTRAINT ck_mensajes_distinto_destinatario CHECK (remitente_id <> destinatario_id);

ALTER TABLE mensajes_privados DROP CONSTRAINT IF EXISTS ck_mensajes_contenido;
ALTER TABLE mensajes_privados ADD CONSTRAINT ck_mensajes_contenido CHECK (char_length(btrim(contenido)) > 0);

ALTER TABLE denuncias_comentarios
  ADD COLUMN IF NOT EXISTS estado VARCHAR(12) NOT NULL DEFAULT 'pendiente';

ALTER TABLE denuncias_comentarios DROP CONSTRAINT IF EXISTS ck_denuncias_comentarios_estado;
ALTER TABLE denuncias_comentarios ADD CONSTRAINT ck_denuncias_comentarios_estado CHECK (estado IN ('pendiente', 'desestimada', 'aceptada'));

ALTER TABLE colecciones DROP CONSTRAINT IF EXISTS ck_colecciones_nombre;
ALTER TABLE colecciones ADD CONSTRAINT ck_colecciones_nombre CHECK (char_length(btrim(nombre)) > 0);

-- documentacion importante --
COMMENT ON TABLE usuarios IS 'cuentas ded la plataforma. rol: usuario o validador. cuenta_activa pasa a false al llegar a 3 publicaciones dadas de baja.';
COMMENT ON TABLE publicaciones IS 'publicacion de un usuario: titulo, descripcion, etiqueta y una o mas imagenes. estado: activa, en_revision o baja.';
COMMENT ON TABLE imagenes IS 'imagenes de una publicacion, cada una con su licencia y marca de agua.';
COMMENT ON TABLE etiquetas IS 'catalogo de etiquetas, tabla aauxiliar.';
COMMENT ON TABLE publicaciones_etiquetas IS 'relacion n:m entre publicaciones y etiquetas.';
COMMENT ON TABLE comentarios IS 'comentarios sobre una imagen. borrado es un borrado logico.';
COMMENT ON TABLE valoraciones IS 'voto de 1 a 5 de un usuario sobre una imagen. un usuario vota una sola vez por imagen.';
COMMENT ON TABLE denuncias_imagenes IS 'denuncias de usuarios sobre una imagen. una por usuario e imagen. el validador revisa acepta o desestima, nunca se borran.';
COMMENT ON TABLE denuncias_comentarios IS 'denuncias sobre un comentario. las revisa el autor de la publicacion.';
COMMENT ON TABLE intereses IS 'marca de interes de un usuario sobre una imagen. una por usuario e imagen.';
COMMENT ON TABLE seguimientos IS 'quien sigue a quien. sin duplicados y sin autoseguimiento.';
COMMENT ON TABLE colecciones IS 'colecciones personales de un usuario. el nombre no se repite por usuario.';
COMMENT ON TABLE colecciones_publicaciones IS 'relacion n:m entre colecciones y publicaciones. la clave compuesta impide el duplicado en una coleccion.';
COMMENT ON TABLE mensajes_privados IS 'mensajeria privada entre usuarios, opcionalmente asociada a una imagen (me interesa).';
COMMENT ON TABLE notificaciones IS 'eventos para el usuario destinatario: comentario, valoracion, me_interesa y seguimiento. actor_id es quien genero la accion.';

COMMENT ON COLUMN imagenes.promedio_valoracion IS 'dato derivado de valoraciones. desnormalizacion para listar sin recalcular el AVG. se actualiza junto con cada voto.';
COMMENT ON COLUMN imagenes.total_votos IS 'dato derivado: cantidad de filas en valoraciones para la imagen';
COMMENT ON COLUMN imagenes.comentarios_cerrados IS 'el autor puede cerrar los comentarios, se conservan los anteriores.';
COMMENT ON COLUMN notificaciones.referencia_id IS 'id del objeto relacionado. referencia polimorfica: no tiene fk, el tipo estaa en referencia_tipo.';
COMMENT ON COLUMN denuncias_imagenes.estado IS 'pendiente: sin resolver. desestimada: el validador la descarto. aceptada: llevo a la baja de la publicacion.';
COMMENT ON COLUMN denuncias_comentarios.estado IS 'pendiente: sin resolver. desestimada: el autor la descarto. aceptada: el comentario fue borrado.';
