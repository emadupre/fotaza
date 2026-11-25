const { Seguimiento, Publicacion, Imagen, Usuario } = require("../models");
const { Op, QueryTypes, literal } = require("sequelize");
const sequelize = require("../config/database");
const { SIN_IMAGENES_CON_COPYRIGHT } = require("../helpers/visibilidad");

// ===== CRITERIO DE LA HOME (también documentado en el README) =====
// Grilla de 12 publicaciones:
//  - Destacadas (hasta 8): tienen una imagen con al menos VOTOS_CONSIDERABLES votos y promedio >= PROMEDIO_BUENO.
//    Se ordenan por puntaje ponderado: (votos*promedio + M*C) / (votos + M), con M = VOTOS_CONSIDERABLES
//    y C = promedio global. Así una foto con 3 votos de 5 no le gana a una con 40 votos de 4,9.
//  - Descubrimiento (el resto, ≈30%): publicaciones elegidas al azar entre las que no están destacadas,
//    para que el contenido nuevo o poco votado también tenga visibilidad.
//  - Se mezclan en patrón 2 destacadas + 1 de descubrimiento.
const TAMANIO = 12;
const CUPO_DESTACADAS = 8;
const VOTOS_CONSIDERABLES = 3; // en una comunidad grande se sube (por ejemplo a 10)
const PROMEDIO_BUENO = 4.0;

async function idsDestacadas(soloPublicas, limite) {
  const filas = await sequelize.query(
    `SELECT i."publicacion_id" AS id
       FROM "imagenes" AS i
       JOIN "publicaciones" AS p ON p."id" = i."publicacion_id"
      WHERE p."estado" <> 'baja'
        AND i."total_votos" >= :minVotos
        AND i."promedio_valoracion" >= :minPromedio
        ${
          soloPublicas
            ? `AND NOT EXISTS (SELECT 1 FROM "imagenes" AS ic
                               WHERE ic."publicacion_id" = p."id" AND ic."licencia" = 'con_copyright')`
            : ""
        }
      GROUP BY i."publicacion_id"
      ORDER BY MAX((i."total_votos" * i."promedio_valoracion"
                    + :minVotos * (SELECT COALESCE(AVG("promedio_valoracion"), 0) FROM "imagenes" WHERE "total_votos" > 0))
                   / (i."total_votos" + :minVotos)) DESC,
               MAX(p."fecha_creacion") DESC
      LIMIT :limite`,
    {
      replacements: {
        minVotos: VOTOS_CONSIDERABLES,
        minPromedio: PROMEDIO_BUENO,
        limite: limite,
      },
      type: QueryTypes.SELECT,
    },
  );
  return filas.map((f) => f.id);
}

async function idsDescubrimiento(excluir, soloPublicas, limite) {
  if (limite <= 0) return [];
  const filas = await Publicacion.findAll({
    attributes: ["id"],
    where: {
      estado: { [Op.ne]: "baja" },
      ...(excluir.length ? { id: { [Op.notIn]: excluir } } : {}),
      ...(soloPublicas ? { [Op.and]: [SIN_IMAGENES_CON_COPYRIGHT] } : {}),
    },
    order: [literal("random()")],
    limit: limite,
    raw: true,
  });
  return filas.map((f) => f.id);
}

// 2 destacadas, 1 de descubrimiento, 2 destacadas, 1 de descubrimiento...
function intercalar(destacadas, descubrimiento) {
  const resultado = [];
  let i = 0;
  let j = 0;
  while (i < destacadas.length || j < descubrimiento.length) {
    for (let k = 0; k < 2 && i < destacadas.length; k++)
      resultado.push(destacadas[i++]);
    if (j < descubrimiento.length) resultado.push(descubrimiento[j++]);
  }
  return resultado;
}

exports.home = async (req, res) => {
  try {
    const sesion = req.session.usuario;
    const soloPublicas = !sesion; // un anónimo solo ve publicaciones sin imágenes con copyright

    const destacadas = await idsDestacadas(soloPublicas, CUPO_DESTACADAS);
    const descubrimiento = await idsDescubrimiento(
      destacadas,
      soloPublicas,
      TAMANIO - destacadas.length,
    );
    const orden = intercalar(destacadas, descubrimiento);

    let publicaciones = [];
    if (orden.length) {
      const cargadas = await Publicacion.findAll({
        where: { id: orden },
        include: [Imagen, { model: Usuario, attributes: ["id", "nombre"] }],
      });
      const porId = new Map(cargadas.map((p) => [p.id, p]));
      publicaciones = orden.map((id) => porId.get(id)).filter(Boolean);
    }

    // sección "De tus seguidos" (solo con sesión)
    let publicacionesSeguidos = [];
    if (sesion) {
      const seguidos = await Seguimiento.findAll({
        where: { seguidor_id: sesion.id },
        attributes: ["seguido_id"],
        raw: true,
      });
      const idsSeguidos = seguidos.map((s) => s.seguido_id);
      if (idsSeguidos.length) {
        publicacionesSeguidos = await Publicacion.findAll({
          where: { usuario_id: idsSeguidos, estado: { [Op.ne]: "baja" } },
          include: [Imagen, { model: Usuario, attributes: ["id", "nombre"] }],
          order: [["fecha_creacion", "DESC"]],
          limit: 12,
        });
      }
    }

    res.render("home", {
      usuario: sesion || null,
      publicaciones,
      destacadas, // para mostrar la insignia ★ en la vista
      publicacionesSeguidos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar la home");
  }
};
