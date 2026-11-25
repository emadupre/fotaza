const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");
const { Comentario, DenunciaComentario } = require("../models");

const aviso = (req, tipo, texto) => {
  req.session.aviso = { tipo, texto };
};

// el comentario esta en una publicación de este usuario? solo autor puede resolver sus denuncias.
async function esDeMiPublicacion(comentarioId, usuarioId) {
  const [fila] = await sequelize.query(
    `SELECT c."id"
       FROM "comentarios" c
       JOIN "imagenes" i ON i."id" = c."imagen_id"
       JOIN "publicaciones" p ON p."id" = i."publicacion_id"
      WHERE c."id" = :comentarioId AND p."usuario_id" = :usuarioId`,
    { replacements: { comentarioId, usuarioId }, type: QueryTypes.SELECT },
  );
  return !!fila;
}

const noEncontrado = (res) =>
  res.status(404).render("error", {
    codigo: 404,
    mensaje: "No encontramos lo que buscabas",
  });

// comentarios denunciados en mis publicaciones, agrupados por publicación y por comentario
exports.panelAutor = async (req, res) => {
  try {
    const filas = await sequelize.query(
      `SELECT p."id" AS publicacion_id, p."titulo" AS publicacion_titulo,
              c."id" AS comentario_id, c."texto", c."fecha" AS comentario_fecha,
              uc."nombre" AS autor_comentario,
              d."motivo", d."descripcion", d."fecha", ud."nombre" AS denunciante
         FROM "denuncias_comentarios" d
         JOIN "usuarios" ud ON ud."id" = d."usuario_id"
         JOIN "comentarios" c ON c."id" = d."comentario_id" AND c."borrado" = false
         JOIN "usuarios" uc ON uc."id" = c."usuario_id"
         JOIN "imagenes" i ON i."id" = c."imagen_id"
         JOIN "publicaciones" p ON p."id" = i."publicacion_id"
        WHERE p."usuario_id" = :yo AND p."estado" <> 'baja' AND d."estado" = 'pendiente'
        ORDER BY p."id", c."id", d."fecha" DESC`,
      { replacements: { yo: req.session.usuario.id }, type: QueryTypes.SELECT },
    );

    const grupos = [];
    const porPublicacion = new Map();
    const porComentario = new Map();
    for (const f of filas) {
      let grupo = porPublicacion.get(f.publicacion_id);
      if (!grupo) {
        grupo = {
          publicacion: { id: f.publicacion_id, titulo: f.publicacion_titulo },
          comentarios: [],
        };
        porPublicacion.set(f.publicacion_id, grupo);
        grupos.push(grupo);
      }
      let comentario = porComentario.get(f.comentario_id);
      if (!comentario) {
        comentario = {
          id: f.comentario_id,
          texto: f.texto,
          autor: f.autor_comentario,
          fecha: f.comentario_fecha,
          denuncias: [],
        };
        porComentario.set(f.comentario_id, comentario);
        grupo.comentarios.push(comentario);
      }
      comentario.denuncias.push({
        motivo: f.motivo,
        descripcion: f.descripcion,
        denunciante: f.denunciante,
        fecha: f.fecha,
      });
    }

    res.render("mis_denuncias", { grupos });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar las denuncias");
  }
};

// el autor decide que la denuncia corresponde: borra el comentario
exports.borrarComentarioDenunciado = async (req, res) => {
  try {
    const comentarioId = Number(req.params.comentario_id);
    if (
      !Number.isInteger(comentarioId) ||
      !(await esDeMiPublicacion(comentarioId, req.session.usuario.id))
    ) {
      return noEncontrado(res);
    }
    await sequelize.transaction(async (t) => {
      await Comentario.update(
        { borrado: true },
        { where: { id: comentarioId }, transaction: t },
      );
      await DenunciaComentario.update(
        { estado: "aceptada" },
        {
          where: { comentario_id: comentarioId, estado: "pendiente" },
          transaction: t,
        },
      );
    });
    aviso(req, "success", "Comentario borrado");
    res.redirect("/mis-denuncias");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al borrar el comentario");
  }
};

// el autor decide que la denuncia no corresponde: el comentario se queda
exports.desestimarDenunciasComentario = async (req, res) => {
  try {
    const comentarioId = Number(req.params.comentario_id);
    if (
      !Number.isInteger(comentarioId) ||
      !(await esDeMiPublicacion(comentarioId, req.session.usuario.id))
    ) {
      return noEncontrado(res);
    }
    await DenunciaComentario.update(
      { estado: "desestimada" },
      { where: { comentario_id: comentarioId, estado: "pendiente" } },
    );
    aviso(req, "info", "Denuncias desestimadas");
    res.redirect("/mis-denuncias");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al desestimar las denuncias");
  }
};
