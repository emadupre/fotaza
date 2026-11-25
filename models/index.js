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

function relacion(padre, hijo, fk, onDelete, alias = {}) {
  padre.hasMany(hijo, { foreignKey: fk, onDelete, as: alias.padre });
  hijo.belongsTo(padre, { foreignKey: fk, onDelete, as: alias.hijo });
}

//reestuctura de las relaciones para un mejor entendimiento.
//el contenido depende de su padre (cascade), los usuarios no se borran,
// se inactivan (restrict), las notificaciones son efimeras (cascade)
// un mensaje sobrevive a la imagen a la que hacía referencia (set null).

relacion(Usuario, Publicacion, "usuario_id", "RESTRICT");
relacion(Publicacion, Imagen, "publicacion_id", "CASCADE");
relacion(Usuario, Comentario, "usuario_id", "RESTRICT");
relacion(Imagen, Comentario, "usuario_id", "CASCADE");
relacion(Usuario, Valoracion, "usuario_id", "RESTRICT");
relacion(Imagen, Valoracion, "imagen_id", "CASCADE");
relacion(Usuario, DenunciaImagen, "usuario_id", "RESTRICT");
relacion(Imagen, DenunciaImagen, "imagen_id", "CASCADE");
relacion(Usuario, DenunciaComentario, "usuario_id", "RESTRICT");
relacion(Comentario, DenunciaComentario, "comentario_id", "CASCADE");
relacion(Usuario, Interes, "usuario_id", "RESTRICT");
relacion(Imagen, Interes, "imagen_id", "CASCADE");
relacion(Usuario, Seguimiento, "seguidor_id", "RESTRICT", {
  padre: "seguimientos_realizados",
  hijo: "seguidor",
});
relacion(Usuario, Seguimiento, "seguido_id", "RESTRICT", {
  padre: "seguimientos_recibidos",
  hijo: "seguido",
});
relacion(Usuario, Coleccion, "usuario_id", "RESTRICT");
relacion(Usuario, Notificacion, "usuario_id", "CASCADE", {
  padre: "notificaciones_recibidas",
  hijo: "destinatario",
});
relacion(Usuario, Notificacion, "actor_id", "CASCADE", {
  padre: "notificaciones_generadas",
  hijo: "actor",
});
relacion(Usuario, MensajePrivado, "remitente_id", "RESTRICT", {
  padre: "mensajes_enviados",
  hijo: "remitente",
});
relacion(Usuario, MensajePrivado, "destinatario_id", "RESTRICT", {
  padre: "mensajes_recibidos",
  hijo: "destinatario",
});
relacion(Imagen, MensajePrivado, "imagen_id", "SET NULL");

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
