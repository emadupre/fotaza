const { literal } = require("sequelize");

// es para un anonimo solo puede ver publicaciones donde ningun imgen tiene copyright
// mismo criterio uso para verPublicacion: así lo que se lista/muestra siempre se puede abrir.

const SIN_IMAGENES_CON_COPYRIGHT = literal(
  `NOT EXISTS (SELECT 1 FROM "imagenes" AS ic WHERE ic."publicacion_id" = "Publicacion"."id" AND ic."licencia" = 'con_copyright')`,
);

module.exports = { SIN_IMAGENES_CON_COPYRIGHT };