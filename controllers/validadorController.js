// panel validador
const { Publicacion, Imagen, DenunciaImagen, Usuario } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
//panel de validador
exports.panel = async (req, res) => {
  try {
    const [resultados] = await sequelize.query(`
      SELECT i."publicacion_id"
      FROM "imagenes" AS i
      INNER JOIN "denuncias_imagenes" AS d
       ON d."imagen_id" = i."id" AND d."estado" = 'pendiente'
      GROUP BY i."publicacion_id"
      HAVING COUNT(DISTINCT d."usuario_id") > 3
      `);

    const idsPublicaciones = resultados.map((r) => r.publicacion_id);

    if (idsPublicaciones.length === 0) {
      return res.render("validador", {
        publicaciones: [],
        usuario: req.session.usuario,
      });
    }

    const publicaciones = await Publicacion.findAll({
      where: {
        id: idsPublicaciones,
        estado: { [Op.ne]: "baja" },
      },
      include: [
        {
          model: Imagen,
          include: [
            {
              model: DenunciaImagen,
              where: { estado: "pendiente" },
              required: false,
              include: [{ model: Usuario, attributes: ["id", "nombre"] }],
            },
          ],
        },
        {
          model: Usuario,
          attributes: ["id", "nombre", "cuenta_activa"],
        },
      ],
    });

    res.render("validador", { publicaciones, usuario: req.session.usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el panel del validador");
  }
};

// dar de baja la publicacion en su totalidad
exports.bajarPublicacion = async (req, res) => {
  try {
    const bajada = await sequelize.transaction(async (t) => {
      const publicacion = await Publicacion.findByPk(
        req.params.publicacion_id,
        { transaction: t },
      );
      if (!publicacion || publicacion.estado === "baja") return false;

      await publicacion.update({ estado: "baja" }, { transaction: t });

      const imagenes = await Imagen.findAll({
        where: { publicacion_id: publicacion.id },
        attributes: ["id"],
        transaction: t,
      });
      await DenunciaImagen.update(
        { estado: "aceptada" },
        {
          where: { imagen_id: imagenes.map((i) => i.id), estado: "pendiente" },
          transaction: t,
        },
      );

      const bajas = await Publicacion.count({
        where: { usuario_id: publicacion.usuario_id, estado: "baja" },
        transaction: t,
      });

      if (bajas >= 3) {
        await Usuario.update(
          {
            cuenta_activa: false,
          },
          { where: { id: publicacion.usuario_id }, transaction: t },
        );
      }
      return true;
    });

    if (!bajada)
      return res
        .status(404)
        .send("Publicacion no encontrada o ya dada de baja.");
    res.redirect("/validador");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al dar de baja");
  }
};

// desestimar las denuncias de una publicacion por si es errado
exports.desestimarDenuncias = async (req, res) => {
  try {
    const publicacion = await Publicacion.findByPk(req.params.publicacion_id, {
      include: [{ model: Imagen }],
    });

    if (!publicacion) return res.status(404).send("Publicacion no encontrada");

    // eliminar todas las denuncias asociadas a la imagen de la publicacion
    const idsImagenes = publicacion.Imagens.map((img) => img.id);
    await DenunciaImagen.update(
      { estado: "desestimada" },
      { where: { imagen_id: idsImagenes, estado: "pendiente" } },
    );

    // esto más bien es opcional pero puede sumar el volver a estado activo si estaba en revision
    if (publicacion.estado === "en_revision") {
      await publicacion.update({ estado: "activa" });
    }

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al desestimar");
  }
};
