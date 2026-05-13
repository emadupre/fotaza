const Usuario = require("./Usuario");
const Publicacion = require("./Publicacion");
const Imagen = require("./Imagen");
const Etiqueta = require("./Etiqueta");
const PublicacionEtiqueta = require("./PublicacionEtiqueta");
const Comentario = require("./Comentario");
const Valoracion = require("./Valoracion");
const DenunciaImagen = require("./DenunciaImagen");
const DenunciaComentario = require("./DenunciaComentario");
const Interes = require("./Interes");
const Seguimiento = require("./Seguimiento");
const Coleccion = require("./Coleccion");
const ColeccionPublicacion = require("./ColeccionPublicacion");
const MensajePrivado = require("./MensajePrivado");
const Notificacion = require("./Notificacion");

//hasMany -> 1
//belongsTo -> N el que tiene la FK.
//belongsToMany -> N:M con through: 'nombre_tabla_intermedia'

// Usuario 1:N Publicacion
Usuario.hasMany(Publicacion, { foreignKey: "usuario_id" });
Publicacion.belongsTo(Usuario, { foreignKey: "usuario_id" });

// Publicacion 1:N Imagen
Publicacion.hasMany(Imagen, { foreignKey: "publicacion_id" });
Imagen.belongsTo(Publicacion, { foreignKey: "publicacion_id" });

//Publicacion N:M Etiqueta (aca uso la intermedia PublicacionEtiqueta)
Publicacion.belongsToMany(Etiqueta, {
  through: PublicacionEtiqueta,
  foreignKey: "publicacion_id",
  otherKey: "etiqueta_id",
});
Etiqueta.belongsToMany(Publicacion, {
  through: PublicacionEtiqueta,
  foreignKey: "etiqueta_id",
  otherKey: "publicacion_id",
});

//Usuario 1:N Comentario
Usuario.hasMany(Comentario, { foreignKey: "usuario_id" });
Comentario.belongsTo(Usuario, { foreignKey: "usuario_id" });

//Imagen 1:N Comentario
Imagen.hasMany(Comentario, { foreignKey: "imagen_id" });
Comentario.belongsTo(Imagen, { foreignKey: "imagen_id" });

//Usuario 1:N Valoracion
Usuario.hasMany(Valoracion, { foreignKey: "usuario_id" });
Valoracion.belongsTo(Usuario, { foreignKey: "usuario_id" });

//Imagen 1:N Valoracion
Imagen.hasMany(Valoracion, { foreignKey: "imagen_id" });
Valoracion.belongsTo(Imagen, { foreignKey: "imagen_id" });

//Usuario 1:N DenunciaImagen
Usuario.hasMany(DenunciaImagen, { foreignKey: "usuario_id" });
DenunciaImagen.belongsTo(Usuario, { foreignKey: "usuario_id" });

//Imagen 1:N DenunciaImagen
Imagen.hasMany(DenunciaImagen, { foreignKey: "imagen_id" });
DenunciaImagen.belongsTo(Imagen, { foreignKey: "imagen_id" });

//Usuario 1:N DenunciaComentario
Usuario.hasMany(DenunciaComentario, { foreignKey: "usuario_id" });
DenunciaComentario.belongsTo(Usuario, { foreignKey: "usuario_id" });

// Comentario 1:N DenunciaComentario
Comentario.hasMany(DenunciaComentario, { foreignKey: "comentario_id" });
DenunciaComentario.belongsTo(Comentario, { foreignKey: "comentario_id" });

//Usuario 1:N Interes
Usuario.hasMany(Interes, { foreignKey: "usuario_id" });
Interes.belongsTo(Usuario, { foreignKey: "usuario_id" });

//Imagen 1:N Interes
Imagen.hasMany(Interes, { foreignKey: "imagen_id" });
Interes.belongsTo(Imagen, { foreignKey: "imagen_id" });

// Usuario 1:N Seguimiento (el que sigue)
Usuario.hasMany(Seguimiento, {
  foreignKey: "seguidor_id",
  as: "seguimientos_realizados",
});
Seguimiento.belongsTo(Usuario, { foreignKey: "seguidor_id", as: "seguidor" });

// Usuario 1:N Seguimiento (el seguido)
Usuario.hasMany(Seguimiento, {
  foreignKey: "seguido_id",
  as: "seguimientos_recibidos",
});
Seguimiento.belongsTo(Usuario, { foreignKey: "seguido_id", as: "seguido" });

// Usuario 1:N Coleccion
Usuario.hasMany(Coleccion, { foreignKey: "usuario_id" });
Coleccion.belongsTo(Usuario, { foreignKey: "usuario_id" });

// Coleccion N:M Publicacion
Coleccion.belongsToMany(Publicacion, {
  through: ColeccionPublicacion,
  foreignKey: "coleccion_id",
  otherKey: "publicacion_id",
});
Publicacion.belongsToMany(Coleccion, {
  through: ColeccionPublicacion,
  foreignKey: "publicacion_id",
  otherKey: "coleccion_id",
});

//Usuario 1:N Notificacion (destinatario)
Usuario.hasMany(Notificacion, {
  foreignKey: "usuario_id",
  as: "notificaciones_recibidas",
});
Notificacion.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "destinatario",
});

//Usuario 1:N Notificacion(actor)
Usuario.hasMany(Notificacion, {
  foreignKey: "actor_id",
  as: "notificaciones_generadas",
});
Notificacion.belongsTo(Usuario, { foreignKey: "actor_id", as: "actor" });

//Usuario 1:N MensajePrivado (remitente)
Usuario.hasMany(MensajePrivado, {
  foreignKey: "remitente_id",
  as: "mensajes_enviados",
});
MensajePrivado.belongsTo(Usuario, {
  foreignKey: "remitente_id",
  as: "remitente",
});

//Usuario 1:N MensajePrivado (destinatario)
Usuario.hasMany(MensajePrivado, {
  foreignKey: "destinatario_id",
  as: "mensajes_recibidos",
});
MensajePrivado.belongsTo(Usuario, {
  foreignKey: "destinatario_id",
  as: "destinatario",
});

//Imagen 1:N MensajePrivado (opcional)
Imagen.hasMany(MensajePrivado, { foreignKey: "imagen_id" });
MensajePrivado.belongsTo(Imagen, { foreignKey: "imagen_id" });

module.exports = {
  Usuario,
  Publicacion,
  Imagen,
  Etiqueta,
  PublicacionEtiqueta,
  Comentario,
  Valoracion,
  DenunciaImagen,
  DenunciaComentario,
  Interes,
  Seguimiento,
  Coleccion,
  ColeccionPublicacion,
  MensajePrivado,
  Notificacion,
};
