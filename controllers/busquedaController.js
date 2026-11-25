const { Publicacion, Imagen, Etiqueta, Usuario } = require("../models");
const { Op, literal } = require("sequelize");
const sequelize = require("../config/database");
const { SIN_IMAGENES_CON_COPYRIGHT } = require("../helpers/visibilidad");
const { normalizarEtiquetas } = require("../helpers/etiquetas");

const POR_PAGINA = 12;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

// Todos los filtros son condiciones sobre Publicacion (EXISTS / IN): así se combinan entre sí
// sin duplicar filas y la paginación cuenta publicaciones, no imágenes.
const esc = (valor) => sequelize.escape(valor);
const patron = (texto) => `%${texto.replace(/[\\%_]/g, "\\$&")}%`; // escapa % y _ del usuario

const EXISTE_IMAGEN = (condicion) =>
  literal(
    `EXISTS (SELECT 1 FROM "imagenes" AS i WHERE i."publicacion_id" = "Publicacion"."id" AND ${condicion})`,
  );
const EXISTE_ETIQUETA = (condicion) =>
  literal(`EXISTS (SELECT 1 FROM "publicaciones_etiquetas" AS pe JOIN "etiquetas" AS e ON e."id" = pe."etiqueta_id"
            WHERE pe."publicacion_id" = "Publicacion"."id" AND ${condicion})`);

// Puntaje de una publicación = el de su imagen mejor valorada; desempata la cantidad de votos
const MEJOR_PROMEDIO = literal(
  `(SELECT COALESCE(MAX(i."promedio_valoracion"), 0) FROM "imagenes" AS i WHERE i."publicacion_id" = "Publicacion"."id")`,
);
const TOTAL_VOTOS = literal(
  `(SELECT COALESCE(SUM(i."total_votos"), 0) FROM "imagenes" AS i WHERE i."publicacion_id" = "Publicacion"."id")`,
);
const ORDENES = {
  recientes: [["fecha_creacion", "DESC"]],
  antiguas: [["fecha_creacion", "ASC"]],
  mejor_valoradas: [
    [MEJOR_PROMEDIO, "DESC"],
    [TOTAL_VOTOS, "DESC"],
    ["fecha_creacion", "DESC"],
  ],
  mas_votadas: [
    [TOTAL_VOTOS, "DESC"],
    ["fecha_creacion", "DESC"],
  ],
};

// "2026-11-24" -> fecha válida a las 00:00 (o 23:59 si es el fin del día), hora de Argentina
function fecha(texto, finDelDia) {
  if (!FECHA_RE.test(texto || "")) return null;
  const f = new Date(
    `${texto}T${finDelDia ? "23:59:59.999" : "00:00:00"}-03:00`,
  );
  return isNaN(f.getTime()) ? null : f;
}

exports.buscar = async (req, res) => {
  try {
    const sesion = req.session.usuario;

    // 1) leer y limpiar los parámetros
    const q = (req.query.q || "").toString().trim().slice(0, 100);
    const etiquetaTexto = (req.query.etiqueta || "")
      .toString()
      .trim()
      .slice(0, 200);
    const etiquetas = normalizarEtiquetas(etiquetaTexto).slice(0, 5);
    const autor = (req.query.usuario || "").toString().trim().slice(0, 100);
    const licencia = ["con_copyright", "sin_copyright"].includes(
      req.query.licencia,
    )
      ? req.query.licencia
      : "";
    const valoracionMin = Math.min(
      5,
      Math.max(0, parseFloat(req.query.valoracion_min) || 0),
    );
    const desde = fecha(req.query.desde, false) ? req.query.desde : "";
    const hasta = fecha(req.query.hasta, true) ? req.query.hasta : "";
    const orden = ORDENES[req.query.orden] ? req.query.orden : "recientes";
    const soloSeguidos = !!sesion && req.query.seguidos === "1";
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);

    // 2) armar las condiciones (todas se combinan con AND)
    const y = [{ estado: { [Op.ne]: "baja" } }];
    if (!sesion) y.push(SIN_IMAGENES_CON_COPYRIGHT); // un anónimo solo ve publicaciones sin copyright

    if (q) {
      y.push({
        [Op.or]: [
          { titulo: { [Op.iLike]: patron(q) } },
          { descripcion: { [Op.iLike]: patron(q) } },
          EXISTE_ETIQUETA(`e."nombre" ILIKE ${esc(patron(q))}`),
        ],
      });
    }
    for (const nombre of etiquetas)
      y.push(EXISTE_ETIQUETA(`e."nombre" = ${esc(nombre)}`)); // debe tener todas
    if (autor) {
      y.push({
        usuario_id: {
          [Op.in]: literal(
            `(SELECT "id" FROM "usuarios" WHERE "nombre" ILIKE ${esc(patron(autor))})`,
          ),
        },
      });
    }
    if (licencia) y.push(EXISTE_IMAGEN(`i."licencia" = ${esc(licencia)}`));
    if (valoracionMin > 0) {
      y.push(
        EXISTE_IMAGEN(
          `i."total_votos" > 0 AND i."promedio_valoracion" >= ${valoracionMin}`,
        ),
      );
    }
    if (desde) y.push({ fecha_creacion: { [Op.gte]: fecha(desde, false) } });
    if (hasta) y.push({ fecha_creacion: { [Op.lte]: fecha(hasta, true) } });
    if (soloSeguidos) {
      y.push({
        usuario_id: {
          [Op.in]: literal(
            `(SELECT "seguido_id" FROM "seguimientos" WHERE "seguidor_id" = ${Number(sesion.id)})`,
          ),
        },
      });
    }
    const where = { [Op.and]: y };

    // 3) contar y traer la página: primero solo los ids, en orden, y después los datos completos
    const total = await Publicacion.count({ where });
    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);

    const filas = await Publicacion.findAll({
      attributes: ["id"],
      where,
      order: [...ORDENES[orden], ["id", "DESC"]],
      limit: POR_PAGINA,
      offset: (paginaActual - 1) * POR_PAGINA,
      raw: true,
    });
    const ids = filas.map((f) => f.id);

    let publicaciones = [];
    if (ids.length) {
      const cargadas = await Publicacion.findAll({
        where: { id: ids },
        include: [
          Imagen,
          Etiqueta,
          { model: Usuario, attributes: ["id", "nombre"] },
        ],
      });
      const porId = new Map(cargadas.map((p) => [p.id, p]));
      publicaciones = ids.map((id) => porId.get(id)).filter(Boolean);
    }

    // 4) querystring sin "pagina", para los links del paginador
    const params = new URLSearchParams();
    const guardar = (clave, valor) => valor && params.set(clave, valor);
    guardar("q", q);
    guardar("etiqueta", etiquetaTexto);
    guardar("usuario", autor);
    guardar("licencia", licencia);
    guardar("valoracion_min", valoracionMin > 0 ? String(valoracionMin) : "");
    guardar("desde", desde);
    guardar("hasta", hasta);
    guardar("orden", orden !== "recientes" ? orden : "");
    guardar("seguidos", soloSeguidos ? "1" : "");

    res.render("buscar", {
      publicaciones,
      terminos: {
        q,
        etiqueta: etiquetaTexto,
        usuario: autor,
        licencia,
        desde,
        hasta,
        orden,
        valoracion_min: valoracionMin > 0 ? valoracionMin : "",
        seguidos: soloSeguidos,
      },
      total,
      pagina: paginaActual,
      totalPaginas,
      queryBase: params.toString(),
      usuario: sesion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en la busqueda");
  }
};
